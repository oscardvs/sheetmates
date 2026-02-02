cmake_minimum_required(VERSION 3.16)
project(libnest2d_wasm VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten-specific settings
if(EMSCRIPTEN)
    message(STATUS "Building for WebAssembly with Emscripten")
    
    # Add libnest2d as header-only library
    # libnest2d is a header-only library, we just need to include its headers
    set(LIBNEST2D_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/vendor/libnest2d/include")
    
    if(EXISTS "${LIBNEST2D_INCLUDE_DIR}")
        message(STATUS "Found libnest2d at: ${LIBNEST2D_INCLUDE_DIR}")
    else()
        message(FATAL_ERROR "libnest2d not found. Run: git clone https://github.com/tamasmeszaros/libnest2d.git vendor/libnest2d")
    endif()
    
    # Create the bindings library
    add_executable(libnest2d
        src/bindings.cpp
    )
    
    target_include_directories(libnest2d PRIVATE
        ${LIBNEST2D_INCLUDE_DIR}
    )
    
    # Emscripten compile options
    target_compile_options(libnest2d PRIVATE
        -fno-exceptions
        -fno-rtti
        -DNDEBUG
    )
    
    # Emscripten link options
    set_target_properties(libnest2d PROPERTIES
        SUFFIX ".js"
        LINK_FLAGS "\
            -s MODULARIZE=1 \
            -s EXPORT_NAME='LibNest2D' \
            -s ENVIRONMENT='worker' \
            -s ALLOW_MEMORY_GROWTH=1 \
            -s INITIAL_MEMORY=16777216 \
            -s MAXIMUM_MEMORY=536870912 \
            -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
            -s EXPORTED_FUNCTIONS=['_malloc','_free'] \
            -s NO_EXIT_RUNTIME=1 \
            -s FILESYSTEM=0 \
            -s SINGLE_FILE=0 \
            --bind \
            -O3 \
            -flto \
        "
    )
    
else()
    message(FATAL_ERROR "This project is designed for Emscripten. Use: emcmake cmake ..")
endif()
