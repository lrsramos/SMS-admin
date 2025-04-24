/**
 * Combines multiple class names into a single string
 * @param {...string} classes - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a component style object with variants
 * @param {Object} styles - Style object with base and variants
 * @param {string} variant - Variant to apply
 * @param {string} size - Size to apply (if applicable)
 * @returns {string} Combined class names
 */
export function createComponentStyle(styles, variant = 'default', size = 'md') {
  const classes = [styles.base];
  
  if (styles.variants && styles.variants[variant]) {
    classes.push(styles.variants[variant]);
  }
  
  if (styles.sizes && styles.sizes[size]) {
    classes.push(styles.sizes[size]);
  }
  
  return cn(...classes);
}

/**
 * Example usage:
 * 
 * import { buttonStyles } from '../styles/components';
 * import { createComponentStyle } from '../utils/styles';
 * 
 * // In your component:
 * const buttonClass = createComponentStyle(buttonStyles, 'primary', 'md');
 * 
 * return <button className={buttonClass}>Click me</button>;
 */ 