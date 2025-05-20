import { axe } from 'jest-axe'
import { render } from '@testing-library/react'

/**
 * Run accessibility tests on a React component
 * @param {React.ReactElement} ui - The component to test
 * @param {Object} options - Options to pass to the render function
 */
export async function checkAccessibility(ui, options = {}) {
  const container = render(ui, options).container
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

/**
 * Custom jest matcher for accessibility testing
 */
expect.extend(toHaveNoViolations)