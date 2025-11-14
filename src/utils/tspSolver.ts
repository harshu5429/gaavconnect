/**
 * Real TSP Solver using Genetic Algorithm
 * with actual distance matrix calculations
 */

export interface TSPSolution {
  route: number[];
  totalDistance: number;
  fitness: number;
}

export interface TSPOptions {
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
  eliteSize?: number;
}

/**
 * Calculate fitness (inverse of total distance) with validation
 */
function calculateFitness(route: number[], distanceMatrix: number[][]): number {
  if (!route || route.length === 0 || !distanceMatrix || distanceMatrix.length === 0) {
    return 0;
  }
  
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const fromIndex = route[i];
    const toIndex = route[i + 1];
    
    // Validate indices and matrix values
    if (fromIndex >= 0 && fromIndex < distanceMatrix.length && 
        toIndex >= 0 && toIndex < distanceMatrix.length &&
        distanceMatrix[fromIndex] && distanceMatrix[fromIndex] !== null &&
        distanceMatrix[fromIndex][toIndex] !== undefined && distanceMatrix[fromIndex][toIndex] !== null) {
      totalDistance += distanceMatrix[fromIndex][toIndex];
    } else {
      console.warn(`Invalid distance matrix access: [${fromIndex}][${toIndex}]`);
      return 0; // Return 0 fitness for invalid routes
    }
  }
  
  // Return to start with validation
  const lastIndex = route[route.length - 1];
  const firstIndex = route[0];
  if (lastIndex >= 0 && lastIndex < distanceMatrix.length && 
      firstIndex >= 0 && firstIndex < distanceMatrix.length &&
      distanceMatrix[lastIndex] && distanceMatrix[lastIndex] !== null &&
      distanceMatrix[lastIndex][firstIndex] !== undefined && distanceMatrix[lastIndex][firstIndex] !== null) {
    totalDistance += distanceMatrix[lastIndex][firstIndex];
  } else {
    console.warn(`Invalid distance matrix access for return: [${lastIndex}][${firstIndex}]`);
    return 0;
  }
  
  return totalDistance > 0 ? 1 / totalDistance : 0;
}

/**
 * Create initial population with random routes
 */
function createInitialPopulation(
  size: number,
  numStops: number,
  distanceMatrix: number[][]
): TSPSolution[] {
  const population: TSPSolution[] = [];
  
  for (let i = 0; i < size; i++) {
    const route = Array.from({ length: numStops }, (_, idx) => idx);
    // Shuffle except first element (starting point)
    for (let j = route.length - 1; j > 1; j--) {
      const randomIdx = Math.floor(Math.random() * (j - 1)) + 1;
      [route[j], route[randomIdx]] = [route[randomIdx], route[j]];
    }
    
    const fitness = calculateFitness(route, distanceMatrix);
    let totalDistance = 0;
    for (let j = 0; j < route.length - 1; j++) {
      totalDistance += distanceMatrix[route[j]][route[j + 1]];
    }
    totalDistance += distanceMatrix[route[route.length - 1]][route[0]];
    
    population.push({ route, totalDistance, fitness });
  }
  
  return population;
}

/**
 * Select parents using tournament selection
 */
function selectParent(population: TSPSolution[]): TSPSolution {
  const tournamentSize = Math.min(5, Math.ceil(population.length / 10));
  let best = population[Math.floor(Math.random() * population.length)];
  
  for (let i = 1; i < tournamentSize; i++) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }
  
  return best;
}

/**
 * Order crossover (OX) for TSP
 */
function crossover(parent1: number[], parent2: number[]): number[] {
  const n = parent1.length;
  const start = Math.floor(Math.random() * n);
  const end = Math.floor(Math.random() * (n - start)) + start;
  
  const child: (number | null)[] = Array(n).fill(null);
  
  // Copy segment from parent1
  for (let i = start; i < end; i++) {
    child[i] = parent1[i];
  }
  
  // Fill remaining from parent2
  let childIndex = (end % n);
  let parent2Index = (end % n);
  
  while (childIndex !== start) {
    const gene = parent2[parent2Index];
    if (!child.includes(gene)) {
      child[childIndex] = gene;
      childIndex = (childIndex + 1) % n;
    }
    parent2Index = (parent2Index + 1) % n;
  }
  
  return child as number[];
}

/**
 * Mutate route using swap mutation
 */
function mutate(route: number[], mutationRate: number): number[] {
  const mutated = [...route];
  const n = mutated.length;
  
  for (let i = 1; i < n; i++) {
    if (Math.random() < mutationRate) {
      const j = Math.floor(Math.random() * (n - 1)) + 1;
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    }
  }
  
  return mutated;
}

/**
 * Advanced TSP Solver using Enhanced Genetic Algorithm
 * Optimized for real-world route planning with adaptive parameters
 */
export function solveTSP(
  distanceMatrix: number[][],
  options: TSPOptions = {},
  onProgress?: (best: TSPSolution, generation: number) => void
): TSPSolution {
  // Validate input
  if (!distanceMatrix || distanceMatrix.length === 0) {
    throw new Error('Distance matrix is empty or undefined');
  }
  
  const numStops = distanceMatrix.length;
  
  // Validate matrix structure
  for (let i = 0; i < numStops; i++) {
    if (!distanceMatrix[i] || distanceMatrix[i].length !== numStops) {
      throw new Error(`Distance matrix row ${i} is invalid`);
    }
  }
  
  // Handle edge cases
  if (numStops < 2) {
    return {
      route: [0],
      totalDistance: 0,
      fitness: 1
    };
  }
  
  if (numStops === 2) {
    return {
      route: [0, 1],
      totalDistance: distanceMatrix[0][1] + distanceMatrix[1][0],
      fitness: 1 / (distanceMatrix[0][1] + distanceMatrix[1][0] || 1)
    };
  }
  
  // Adaptive parameters based on problem size
  const {
    populationSize = Math.max(50, Math.min(200, numStops * 10)),
    generations = Math.max(100, Math.min(500, numStops * 20)),
    mutationRate = Math.max(0.01, Math.min(0.05, 0.8 / numStops)),
    eliteSize = Math.ceil((options.populationSize || Math.max(50, Math.min(200, numStops * 10))) * 0.15),
  } = options;

  let population = createInitialPopulation(populationSize, numStops, distanceMatrix);
  let bestSolution = population.reduce((prev, current) =>
    prev.fitness > current.fitness ? prev : current
  );

  for (let gen = 0; gen < generations; gen++) {
    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness);
    
    const newPopulation: TSPSolution[] = [];
    
    // Keep elite solutions
    for (let i = 0; i < eliteSize; i++) {
      newPopulation.push(population[i]);
    }
    
    // Generate new solutions
    while (newPopulation.length < populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      
      let child = crossover(parent1.route, parent2.route);
      child = mutate(child, mutationRate);
      
      const fitness = calculateFitness(child, distanceMatrix);
      let totalDistance = 0;
      for (let j = 0; j < child.length - 1; j++) {
        totalDistance += distanceMatrix[child[j]][child[j + 1]];
      }
      totalDistance += distanceMatrix[child[child.length - 1]][child[0]];
      
      newPopulation.push({ route: child, totalDistance, fitness });
    }
    
    population = newPopulation.slice(0, populationSize);
    
    const currentBest = population.reduce((prev, current) =>
      prev.fitness > current.fitness ? prev : current
    );
    
    if (currentBest.fitness > bestSolution.fitness) {
      bestSolution = { ...currentBest };
    }
    
    if (onProgress) {
      onProgress(bestSolution, gen);
    }
  }

  return bestSolution;
}

/**
 * Nearest neighbor heuristic for quick solution
 */
export function nearestNeighborTSP(distanceMatrix: number[][]): TSPSolution {
  const n = distanceMatrix.length;
  const route = [0];
  const visited = new Set([0]);
  
  while (visited.size < n) {
    const current = route[route.length - 1];
    let nearest = -1;
    let nearestDist = Infinity;
    
    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && 
          distanceMatrix[current] && distanceMatrix[current][i] !== null && 
          distanceMatrix[current][i] < nearestDist) {
        nearest = i;
        nearestDist = distanceMatrix[current][i];
      }
    }
    
    if (nearest !== -1) {
      route.push(nearest);
      visited.add(nearest);
    } else {
      // If no valid nearest neighbor found, add the next unvisited point
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          route.push(i);
          visited.add(i);
          break;
        }
      }
    }
  }
  
  const fitness = calculateFitness(route, distanceMatrix);
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    if (distanceMatrix[route[i]] && distanceMatrix[route[i]][route[i + 1]] !== null) {
      totalDistance += distanceMatrix[route[i]][route[i + 1]];
    } else {
      totalDistance += 999; // Use large distance for invalid segments
    }
  }
  if (distanceMatrix[route[route.length - 1]] && distanceMatrix[route[route.length - 1]][route[0]] !== null) {
    totalDistance += distanceMatrix[route[route.length - 1]][route[0]];
  } else {
    totalDistance += 999;
  }
  
  return { route, totalDistance, fitness };
}
