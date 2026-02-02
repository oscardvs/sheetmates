# WASM Nesting Module Output

This directory contains the compiled WASM nesting module.

## Files (after build)

- `libnest2d.js` - JavaScript glue code
- `libnest2d.wasm` - WebAssembly binary

## Building

Run from the project root:

```bash
# Using Docker (recommended)
cd wasm && ./build.sh --docker

# Using native Emscripten
cd wasm && ./build.sh
```

## Note

If these files don't exist, the application will automatically fall back to the JavaScript shelf-packing algorithm. WASM is optional but provides better optimization through genetic algorithm iterations.
