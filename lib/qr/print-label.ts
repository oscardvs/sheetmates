import QRCode from "qrcode";

export interface LabelData {
  qrCode: string;
  sheetId: string;
  material?: string;
  thickness?: number;
  dimensions?: string;
}

/**
 * Generates and prints a QR code label for a sheet
 * Opens browser print dialog with a formatted label
 */
export async function printQRLabel(data: LabelData): Promise<void> {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(data.qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Create print window with label HTML
    const printWindow = window.open("", "_blank", "width=400,height=600");

    if (!printWindow) {
      throw new Error("Popup blocked - please allow popups to print labels");
    }

    // Generate label HTML
    const labelHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Sheet Label - ${data.qrCode}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }

            .label {
              border: 2px solid #000;
              padding: 20px;
              text-align: center;
              background: white;
              max-width: 400px;
            }

            .label-header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }

            .qr-code {
              margin: 20px 0;
            }

            .qr-code img {
              width: 300px;
              height: 300px;
            }

            .qr-text {
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0;
              word-break: break-all;
            }

            .sheet-info {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #ccc;
              font-size: 12px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }

            .info-label {
              font-weight: bold;
            }

            @media print {
              body {
                padding: 0;
              }

              .label {
                border: 2px solid #000;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="label-header">
              SHEETMATES - SHEET LABEL
            </div>

            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="qr-text">
              ${data.qrCode}
            </div>

            ${
              data.material || data.thickness || data.dimensions
                ? `
            <div class="sheet-info">
              ${
                data.material
                  ? `
              <div class="info-row">
                <span class="info-label">Material:</span>
                <span>${data.material}</span>
              </div>
              `
                  : ""
              }
              ${
                data.thickness
                  ? `
              <div class="info-row">
                <span class="info-label">Thickness:</span>
                <span>${data.thickness}mm</span>
              </div>
              `
                  : ""
              }
              ${
                data.dimensions
                  ? `
              <div class="info-row">
                <span class="info-label">Dimensions:</span>
                <span>${data.dimensions}</span>
              </div>
              `
                  : ""
              }
            </div>
            `
                : ""
            }
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();

    // Wait for images to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after printing or cancel
        printWindow.onafterprint = () => printWindow.close();
      }, 250);
    };
  } catch (error) {
    console.error("Failed to print QR label:", error);
    throw new Error(
      `Failed to print label: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
