import { AspectWeights } from '../services/resume-analysis.service';

/**
 * Default weights for resume analysis if none are provided
 */
export const DEFAULT_WEIGHTS: AspectWeights = {
  skills: 2.0,      // Most important
  experience: 1.5,  // Very important
  achievements: 1.0, // Important
  education: 0.8,    // Somewhat important
  culturalFit: 0.7   // Least important
};

/**
 * Validates and normalizes weights for resume analysis
 * 
 * @param weights The weights to validate and normalize
 * @returns Validated and normalized weights
 */
export function validateWeights(weights: Partial<AspectWeights> | null): AspectWeights {
  // If no weights provided, use defaults
  if (!weights) {
    return { ...DEFAULT_WEIGHTS };
  }
  
  // Start with default weights
  const validatedWeights: AspectWeights = { ...DEFAULT_WEIGHTS };
  
  // Update with provided weights, ensuring they are valid numbers
  for (const key in weights) {
    const typedKey = key as keyof AspectWeights;
    const value = weights[typedKey];
    
    // Check if value is a valid number
    if (value !== undefined && !isNaN(Number(value))) {
      validatedWeights[typedKey] = Number(value);
    }
  }
  
  return validatedWeights;
}

/**
 * Normalizes weights to a specific range (default 0-1)
 * 
 * @param weights The weights to normalize
 * @param minValue Minimum value after normalization (default: 0)
 * @param maxValue Maximum value after normalization (default: 1)
 * @returns Normalized weights
 */
export function normalizeWeights(
  weights: AspectWeights,
  minValue: number = 0,
  maxValue: number = 1
): AspectWeights {
  // Find the min and max values
  const values = Object.values(weights);
  const minWeight = Math.min(...values);
  const maxWeight = Math.max(...values);
  
  // If all weights are the same, return weights with all values set to maxValue
  if (minWeight === maxWeight) {
    const result = { ...weights };
    for (const key in result) {
      result[key as keyof AspectWeights] = maxValue;
    }
    return result;
  }
  
  // Normalize the weights
  const normalizedWeights: AspectWeights = { ...weights };
  for (const key in normalizedWeights) {
    const typedKey = key as keyof AspectWeights;
    const value = normalizedWeights[typedKey];
    
    // Normalize to 0-1 range
    const normalized = (value - minWeight) / (maxWeight - minWeight);
    
    // Scale to desired range
    normalizedWeights[typedKey] = minValue + normalized * (maxValue - minValue);
  }
  
  return normalizedWeights;
}

/**
 * Converts a JSON string to validated AspectWeights
 * 
 * @param weightsJson JSON string containing weights
 * @returns Validated weights or null if JSON is invalid
 */
export function parseWeightsJson(weightsJson: string | null): AspectWeights | null {
  if (!weightsJson) {
    return null;
  }
  
  try {
    const parsedWeights = JSON.parse(weightsJson);
    return validateWeights(parsedWeights);
  } catch (e) {
    console.error('Error parsing weights JSON:', e);
    return null;
  }
}

/**
 * Formats weights as a JSON string, ensuring valid values
 * 
 * @param weights The weights to format
 * @returns Formatted JSON string
 */
export function formatWeightsJson(weights: Partial<AspectWeights> | null): string {
  const validatedWeights = validateWeights(weights);
  return JSON.stringify(validatedWeights, null, 2);
} 