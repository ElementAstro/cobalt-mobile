import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveClass(className: string): R
      toHaveStyle(style: string | Record<string, any>): R
      toHaveTextContent(text: string | RegExp): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeChecked(): R
      toHaveValue(value: string | number): R
      toHaveDisplayValue(value: string | string[]): R
      toBeRequired(): R
      toBeInvalid(): R
      toBeValid(): R
      toHaveFocus(): R
      toHaveAccessibleName(name: string | RegExp): R
      toHaveAccessibleDescription(description: string | RegExp): R
      toHaveErrorMessage(message: string | RegExp): R
    }
  }
}
