# Emscripten build container for libnest2d WASM compilation
# Usage: docker build -t sheetmates-wasm . && docker run -v $(pwd)/output:/output sheetmates-wasm

FROM emscripten/emsdk:3.1.51

LABEL maintainer="Sheetmates Team"
LABEL description="Build container for libnest2d WASM module"

# Install additional build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    ninja-build \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy source files
COPY CMakeLists.txt ./
COPY src/ ./src/

# Create vendor directory (libnest2d will be cloned if not present)
RUN mkdir -p vendor

# Build script
RUN mkdir -p /output

CMD ["sh", "-c", "\
    # Clone libnest2d if not present \n\
    if [ ! -d 'vendor/libnest2d' ]; then \n\
        git clone --depth 1 https://github.com/tamasmeszaros/libnest2d.git vendor/libnest2d; \n\
    fi && \n\
    \n\
    # Configure with Emscripten \n\
    emcmake cmake -B build -G Ninja \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_CXX_FLAGS='-O3 -flto' && \n\
    \n\
    # Build \n\
    cmake --build build --parallel && \n\
    \n\
    # Copy outputs \n\
    cp build/libnest2d.js /output/ && \n\
    cp build/libnest2d.wasm /output/ && \n\
    echo 'Build complete! Output in /output/'"]
