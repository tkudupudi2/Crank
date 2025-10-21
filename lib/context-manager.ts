// Shared context manager for NLP conversations
class ContextManager {
  private static contextMemory: Map<string, any[]> = new Map()
  
  static clearUserContext(userId: string): void {
    this.contextMemory.delete(userId)
    console.log(`Cleared context for user ${userId}`)
  }
  
  static getContext(userId: string): any[] {
    return this.contextMemory.get(userId) || []
  }
  
  static updateContext(userId: string, contextItem: any): void {
    if (!this.contextMemory.has(userId)) {
      this.contextMemory.set(userId, [])
    }
    
    const context = this.contextMemory.get(userId)!
    context.push(contextItem)
    
    // Keep only last 10 items
    if (context.length > 10) {
      context.shift()
    }
    
    console.log(`Updated context for user ${userId}:`, context.length, 'items')
  }
  
  static getContextMemory(): Map<string, any[]> {
    return this.contextMemory
  }
}

export default ContextManager
