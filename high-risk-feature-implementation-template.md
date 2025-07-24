# 🚨 HIGH-RISK FEATURE IMPLEMENTATION TEMPLATE

**⚠️ CRITICAL**: This template is mandatory for any feature that touches AuthContext, entitlements, caching, real-time systems, or database schema. Failure to follow this process can result in infinite recursion bugs and critical system failures.

---

## 📋 FEATURE CLASSIFICATION & OVERVIEW

### Feature Name
**[FEATURE_NAME]**

### Feature Description
**[Detailed description of what needs to be implemented]**

### Risk Classification Confirmation
This feature is classified as **HIGH RISK** because it affects (check all that apply):
- [ ] AuthContext or authentication flow
- [ ] Entitlements or permission systems  
- [ ] Caching mechanisms or cache invalidation
- [ ] Real-time subscriptions or WebSocket connections
- [ ] Database schema or critical tables
- [ ] User session handling
- [ ] Security policies or access control
- [ ] Other critical system: **[SPECIFY]**

---

## 🔍 PHASE 1: MANDATORY CONTEXT GATHERING & RISK ASSESSMENT

**⚠️ STOP**: You must complete ALL analysis below and receive explicit approval before proceeding to Phase 2.

### 1.1 Complete System Architecture Mapping

#### Call Graph Analysis
**Task**: Map the complete function call chain for this feature.

**Required Deliverables**:
- [ ] List all functions that will be modified or called by this feature
- [ ] Trace the complete dependency chain from UI entry point to database/external APIs
- [ ] Identify any circular or recursive call patterns (CRITICAL - suspension system failure cause)
- [ ] Document all cache invalidation triggers and cascades
- [ ] Create visual diagram of call flow

**Analysis Questions**:
1. What existing functions will call the new feature components?
2. What functions will the new feature need to call?
3. Are there any existing recursive patterns in related code?
4. How does this feature integrate with the current function call hierarchy?

#### Dependency Chain Documentation
**Task**: Document all system dependencies.

**Required Analysis**:
- [ ] Map all React Context dependencies (AuthContext, UserProfileContext, etc.)
- [ ] Identify all useEffect dependencies that could create loops
- [ ] Document all state variables that trigger re-renders
- [ ] List all external service dependencies (Supabase, APIs)

### 1.2 Integration Risk Assessment

#### Existing System Conflict Analysis
**Task**: Identify potential conflicts with existing systems.

**Critical Analysis Areas**:
- [ ] **AuthContext Integration**: How does this feature interact with authentication state?
- [ ] **Entitlements System**: Does this feature affect user permissions or role calculations?
- [ ] **Caching Systems**: Will this feature invalidate caches or create cache conflicts?
- [ ] **Real-time Subscriptions**: Are there overlapping Supabase Realtime subscriptions?

**Analysis Questions**:
1. What existing systems check or modify the same data this feature will use?
2. Are there existing useEffect hooks that could conflict with new ones?
3. How many real-time subscriptions currently exist and where?
4. What cache invalidation patterns currently exist in related systems?

#### useEffect Dependency Loop Analysis (CRITICAL)
**Task**: Prevent the type of infinite loops that caused the suspension system failure.

**Required Analysis**:
- [ ] List all proposed useEffect hooks and their dependencies
- [ ] Identify any dependencies that the effect itself might modify
- [ ] Check for state variables that could trigger cascading updates
- [ ] Verify no circular dependency patterns exist

**Specific Questions**:
1. Do any useEffect dependencies include state that the effect modifies?
2. Could this feature trigger AuthContext re-initialization?
3. Are there any state updates that could cause infinite re-renders?

### 1.3 Performance Impact Analysis

#### Database Query Analysis
**Task**: Analyze all database operations and their performance implications.

**Required Analysis**:
- [ ] Count all new database queries this feature will add
- [ ] Identify any queries that could be called in loops
- [ ] Estimate query frequency and load impact
- [ ] Plan query optimization and caching strategy

**Performance Questions**:
1. How many database queries will this feature add per user action?
2. Could any of these queries be called repeatedly in loops?
3. What's the worst-case scenario for database load?
4. How will this affect existing query performance?

#### Cache Impact Assessment
**Task**: Analyze effects on existing caching systems.

**Required Analysis**:
- [ ] Identify all caches this feature will interact with
- [ ] Document cache invalidation patterns
- [ ] Estimate cache hit/miss ratio changes
- [ ] Plan cache warming and optimization strategies

### 1.4 Security Implications Review

#### Authentication & Authorization Analysis
**Task**: Ensure secure implementation of all access controls.

**Required Analysis**:
- [ ] Document all authentication requirements
- [ ] Map authorization checks at each access point
- [ ] Identify potential privilege escalation risks
- [ ] Plan session handling and validation

#### Data Access Security
**Task**: Secure all data access patterns.

**Required Analysis**:
- [ ] List all user data this feature will access or modify
- [ ] Document input validation and sanitization requirements
- [ ] Plan secure data storage and transmission
- [ ] Identify potential data leakage risks

### 1.5 Existing Bug Identification

#### Related System Bug Analysis
**Task**: Identify and document existing bugs in related systems.

**Required Analysis**:
- [ ] Check for existing performance issues in related components
- [ ] Identify any known bugs in AuthContext, entitlements, or caching
- [ ] Document any workarounds currently in place
- [ ] Plan fixes for existing issues that could be amplified

---

## 🏗️ PHASE 2: ARCHITECTURE DESIGN & INTEGRATION PLANNING

**⚠️ APPROVAL GATE**: Phase 1 analysis must be approved before proceeding.

### 2.1 Implementation Architecture Design

#### System Integration Strategy
**Task**: Design how this feature integrates with existing systems.

**Required Deliverables**:
- [ ] Detailed component architecture diagram
- [ ] Integration points with existing systems
- [ ] Data flow diagrams showing all interactions
- [ ] State management strategy

#### Circuit Breaker & Safeguard Design
**Task**: Design mandatory protective measures to prevent infinite loops.

**Required Safeguards**:
- [ ] Circuit breakers for any recursive functions
- [ ] Maximum iteration limits for loops
- [ ] Timeout mechanisms for long-running operations
- [ ] Performance monitoring and alerting

### 2.2 Error Handling & Recovery Strategy

#### Comprehensive Error Handling Plan
**Task**: Plan for all possible failure scenarios.

**Required Planning**:
- [ ] Error handling for all external service failures
- [ ] Graceful degradation strategies
- [ ] User-friendly error messaging
- [ ] Error logging and monitoring

#### Rollback Strategy Design
**Task**: Plan complete rollback capabilities.

**Required Planning**:
- [ ] Feature flag implementation for instant disable
- [ ] Database rollback procedures
- [ ] Cache clearing and reset mechanisms
- [ ] User session recovery procedures

### 2.3 Testing Strategy

#### Integration Testing Plan
**Task**: Plan comprehensive testing with existing systems.

**Required Testing**:
- [ ] Unit tests for all new functions
- [ ] Integration tests with AuthContext
- [ ] Cache invalidation testing
- [ ] Performance benchmarking
- [ ] Security testing

---

## 🛠️ PHASE 3: IMPLEMENTATION WITH MANDATORY SAFEGUARDS

**⚠️ APPROVAL GATE**: Phase 2 architecture must be approved before implementation.

### 3.1 Mandatory Implementation Safeguards

#### Circuit Breaker Implementation (CRITICAL)
**Task**: Implement protection against infinite loops.

**Required Implementation**:
```typescript
// Example circuit breaker pattern
const circuitBreaker = new Map<string, number>();
function preventInfiniteLoop(key: string, maxCalls = 5): boolean {
  const count = circuitBreaker.get(key) || 0;
  if (count >= maxCalls) {
    console.error(`🚨 CIRCUIT BREAKER: ${key} exceeded ${maxCalls} calls`);
    return false;
  }
  circuitBreaker.set(key, count + 1);
  setTimeout(() => circuitBreaker.delete(key), 1000);
  return true;
}
```

#### Performance Monitoring Implementation
**Task**: Add comprehensive performance monitoring.

**Required Monitoring**:
- [ ] Query execution time tracking
- [ ] Memory usage monitoring
- [ ] Cache hit/miss ratio tracking
- [ ] Error rate monitoring

### 3.2 Integration Implementation

#### Safe Integration Patterns
**Task**: Implement using safe patterns that prevent conflicts.

**Required Patterns**:
- [ ] Defensive programming with null checks
- [ ] Timeout mechanisms for all async operations
- [ ] Proper cleanup in useEffect hooks
- [ ] Error boundaries for all new components

---

## 🧪 PHASE 4: TESTING & VALIDATION

**⚠️ APPROVAL GATE**: Phase 3 implementation must be approved before final testing.

### 4.1 Comprehensive Testing Requirements

#### System Integration Testing
**Task**: Test integration with all existing systems.

**Required Tests**:
- [ ] AuthContext integration testing
- [ ] Entitlements system compatibility
- [ ] Cache invalidation testing
- [ ] Real-time subscription conflict testing
- [ ] Database performance testing

#### Performance Validation
**Task**: Validate performance meets requirements.

**Required Validation**:
- [ ] No infinite loops detected
- [ ] Database queries complete within acceptable time
- [ ] Memory usage remains stable
- [ ] Cache effectiveness maintained

### 4.2 Rollback Procedure Validation

#### Rollback Testing
**Task**: Validate all rollback procedures work correctly.

**Required Testing**:
- [ ] Feature flag disable testing
- [ ] Database rollback testing
- [ ] Cache reset testing
- [ ] User session recovery testing

---

## ✅ MANDATORY SAFEGUARDS CHECKLIST

### Universal Safeguards (Must Implement)
- [ ] Circuit breakers for recursive functions
- [ ] Performance monitoring and query limits
- [ ] Comprehensive error boundaries
- [ ] Timeout mechanisms for async operations
- [ ] Proper useEffect cleanup functions
- [ ] Input validation and sanitization
- [ ] Authorization checks at all access points

### High-Risk Specific Safeguards
- [ ] Cache invalidation cascade prevention
- [ ] useEffect dependency loop detection
- [ ] Real-time subscription conflict prevention
- [ ] Database connection pooling and limits
- [ ] Memory leak prevention
- [ ] Session management validation

---

## 🚨 RED FLAG DETECTION

### Critical Red Flags (STOP IMMEDIATELY)
- [ ] Function calls itself directly or indirectly
- [ ] useEffect dependencies include state modified by the effect
- [ ] Database queries inside loops without limits
- [ ] Cache invalidation triggering more cache invalidation
- [ ] Multiple real-time subscriptions to the same data
- [ ] Authentication bypass or session manipulation

### Warning Flags (Request Additional Analysis)
- [ ] More than 3 database queries per user action
- [ ] Async operations inside loops
- [ ] State updates in useEffect without cleanup
- [ ] External API calls without timeout/retry logic
- [ ] Complex nested async/await patterns
- [ ] Memory allocation without cleanup

---

## 📝 APPROVAL GATES SUMMARY

### Phase 1 Approval Required
- [ ] Complete system architecture mapping
- [ ] Integration risk assessment
- [ ] Performance impact analysis
- [ ] Security implications review
- [ ] Existing bug identification

**STOP**: Wait for explicit approval before Phase 2

### Phase 2 Approval Required
- [ ] Implementation architecture design
- [ ] Error handling and recovery strategy
- [ ] Testing strategy
- [ ] Circuit breaker and safeguard design

**STOP**: Wait for explicit approval before Phase 3

### Phase 3 Approval Required
- [ ] Implementation with mandatory safeguards
- [ ] Circuit breaker implementation
- [ ] Performance monitoring
- [ ] Safe integration patterns

**STOP**: Wait for explicit approval before Phase 4

### Phase 4 Final Approval
- [ ] Comprehensive testing completed
- [ ] Performance validation passed
- [ ] Rollback procedures validated
- [ ] All safeguards verified working

**Final approval required before deployment**

---

## 📚 LESSONS LEARNED REFERENCE

### Suspension System Failure Analysis
This template was created based on the critical failure of the suspension system implementation that caused infinite recursion bugs. Key lessons:

1. **Insufficient Context Analysis**: Failed to map existing entitlements caching system
2. **Ignored Existing Bugs**: Amplified pre-existing recursive cache issue
3. **Poor Integration Testing**: Didn't test with existing cache scenarios
4. **Missing Safeguards**: No circuit breakers or performance limits

### Prevention Principles
1. **Always map complete call graphs** before implementation
2. **Identify and fix existing bugs** before adding new features
3. **Implement circuit breakers** for any recursive-prone functions
4. **Test integration scenarios** with existing systems
5. **Add performance monitoring** to all critical paths

---

**Remember**: It's better to spend extra time on analysis than to cause critical system failures that take much longer to fix. This template enforces the rigorous process necessary to prevent the type of infinite recursion bugs that broke the profile page and overwhelmed the database.
