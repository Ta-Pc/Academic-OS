export class DependencyGraph {
  private adjacencyList: Map<string, string[]> = new Map();
  private reverseAdjacencyList: Map<string, string[]> = new Map();

  /**
   * Adds a node to the graph with its dependencies.
   * Throws an error if adding this node would create a circular dependency.
   */
  addNode(nodeId: string, dependencies: string[]): void {
    // Ensure node exists in adjacency list
    if (!this.adjacencyList.has(nodeId)) {
      this.adjacencyList.set(nodeId, []);
    }

    // Add dependencies (nodeId depends on these)
    this.adjacencyList.set(nodeId, dependencies);

    // Update reverse adjacency (who depends on whom)
    for (const dep of dependencies) {
      if (!this.reverseAdjacencyList.has(dep)) {
        this.reverseAdjacencyList.set(dep, []);
      }
      if (!this.reverseAdjacencyList.get(dep)!.includes(nodeId)) {
        this.reverseAdjacencyList.get(dep)!.push(nodeId);
      }
    }

    // Check for cycles
    if (this.hasCycle()) {
      // Remove the added node to revert
      this.adjacencyList.delete(nodeId);
      for (const dep of dependencies) {
        const dependents = this.reverseAdjacencyList.get(dep)!;
        const index = dependents.indexOf(nodeId);
        if (index > -1) {
          dependents.splice(index, 1);
        }
      }
      throw new Error(`Adding node '${nodeId}' with dependencies [${dependencies.join(', ')}] would create a circular dependency.`);
    }
  }

  /**
   * Returns all nodes that depend on the given node, in topological order.
   * This means the order in which they should be recalculated.
   */
  getDependents(nodeId: string): string[] {
    const dependents: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (current: string) => {
      if (visiting.has(current)) {
        throw new Error(`Circular dependency detected involving '${current}'`);
      }
      if (visited.has(current)) {
        return;
      }

      visiting.add(current);

      const directDependents = this.reverseAdjacencyList.get(current) || [];
      for (const dep of directDependents) {
        dfs(dep);
      }

      visiting.delete(current);
      visited.add(current);
      dependents.unshift(current); // Add to front for topological order
    };

    dfs(nodeId);

    // Remove the nodeId itself if present, as dependents are those that depend on it
    return dependents.filter(dep => dep !== nodeId);
  }

  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const deps = this.adjacencyList.get(node) || [];
      for (const dep of deps) {
        if (dfs(dep)) return true;
      }

      recStack.delete(node);
      return false;
    };

    for (const node of this.adjacencyList.keys()) {
      if (dfs(node)) return true;
    }

    return false;
  }
}
