// Mock for codegenNativeComponent
export const codegenNativeComponent = (componentName) => {
  return () => null
}

// Mock for codegenNativeCommands
export const codegenNativeCommands = (options) => {
  return {}
}

// Export other commonly used RN utilities
export const Platform = {
  OS: 'web',
  select: (obj) => obj.web || obj.default
}

export const requireNativeComponent = (name) => {
  return () => null
}