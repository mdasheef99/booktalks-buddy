# ⚡ SIMPLIFIED HIGH-RISK FEATURE TEMPLATE

**🚨 Use this template for features affecting**: AuthContext, entitlements, caching, real-time systems, or database schema.

---

## 📋 FEATURE REQUEST

### Feature Name: **[FEATURE_NAME]**
### Description: **[DETAILED_FEATURE_DESCRIPTION]**

### High-Risk Classification (check all that apply):
- [ ] AuthContext or authentication changes
- [ ] Entitlements/permissions system
- [ ] Caching mechanisms
- [ ] Real-time subscriptions/WebSocket
- [ ] Database schema changes
- [ ] User session handling
- [ ] Other: **[SPECIFY]**

---

## 🔍 PHASE 1: CRITICAL ANALYSIS REQUIRED

**⚠️ MANDATORY**: Complete ALL analysis below before implementation. Wait for my approval.

### 1.1 System Integration Analysis

#### Call Graph & Dependencies
**Required Analysis**:
- [ ] Map all functions this feature will call and be called by
- [ ] Identify any circular/recursive call patterns (CRITICAL - prevents infinite loops)
- [ ] Check for useEffect dependency loops (accountStatus dependency issue from suspension system)
- [ ] Document cache invalidation triggers

**Key Questions**:
1. What existing functions interact with the components you'll modify?
2. Are there any recursive patterns in related code?
3. Could this create useEffect dependency loops like the suspension system bug?
4. How does this integrate with AuthContext without causing re-initialization loops?

#### Performance & Database Impact
**Required Analysis**:
- [ ] Count database queries added/modified
- [ ] Identify operations that could run in loops
- [ ] Estimate worst-case performance scenario
- [ ] Plan caching strategy

**Key Questions**:
1. How many DB queries per user action?
2. Could any queries be called repeatedly in loops?
3. Will this affect existing cache performance?

### 1.2 Integration Risk Assessment

#### Conflict Detection
**Required Analysis**:
- [ ] Check for conflicts with existing AuthContext patterns
- [ ] Identify overlapping real-time subscriptions
- [ ] Verify no cache invalidation cascades
- [ ] Review existing bugs that could be amplified

**Key Questions**:
1. What existing systems check/modify the same data?
2. Are there existing performance issues this could worsen?
3. How many real-time subscriptions currently exist?

### 1.3 Security & Authorization
**Required Analysis**:
- [ ] Document authentication requirements
- [ ] Map authorization checks needed
- [ ] Plan input validation and sanitization
- [ ] Review session handling requirements

---

## 🛠️ PHASE 2: IMPLEMENTATION WITH SAFEGUARDS

**⚠️ APPROVAL GATE**: Phase 1 must be approved before implementation.

### 2.1 Mandatory Safeguards Implementation

#### Circuit Breakers (CRITICAL)
**Must implement to prevent infinite loops**:
```typescript
// Example pattern - adapt as needed
const operationInProgress = new Set<string>();

function preventInfiniteLoop(key: string): boolean {
  if (operationInProgress.has(key)) {
    console.error(`🚨 CIRCUIT BREAKER: ${key} already in progress`);
    return false;
  }
  operationInProgress.add(key);
  setTimeout(() => operationInProgress.delete(key), 5000);
  return true;
}
```

#### Performance Safeguards
**Must implement**:
- [ ] Query timeouts (max 5 seconds)
- [ ] Maximum iteration limits for loops
- [ ] Memory usage monitoring
- [ ] Error boundaries for new components

#### useEffect Safety
**Must implement to prevent dependency loops**:
- [ ] Avoid including state that the effect modifies in dependencies
- [ ] Add proper cleanup functions
- [ ] Use useCallback/useMemo for expensive operations
- [ ] Add circuit breakers for effects that could loop

### 2.2 Implementation Requirements

#### Error Handling
**Required**:
- [ ] Comprehensive try-catch blocks
- [ ] Graceful degradation for service failures
- [ ] User-friendly error messages
- [ ] Rollback capability

#### Testing & Validation
**Required before approval**:
- [ ] Integration testing with existing systems
- [ ] Performance benchmarking (no operations > 3 seconds)
- [ ] Infinite loop prevention testing
- [ ] Cache invalidation testing

---

## ✅ ESSENTIAL SAFEGUARDS CHECKLIST

### Critical Safeguards (Must Implement)
- [ ] Circuit breakers for any recursive functions
- [ ] useEffect dependency loop prevention
- [ ] Query timeouts and limits
- [ ] Error boundaries
- [ ] Proper cleanup functions
- [ ] Performance monitoring

### Integration Safeguards
- [ ] No cache invalidation cascades
- [ ] No overlapping real-time subscriptions
- [ ] AuthContext integration without re-initialization loops
- [ ] Database connection limits

---

## 🚨 RED FLAGS - STOP IMPLEMENTATION

### Critical Red Flags (Immediate Stop)
- [ ] Function calls itself directly/indirectly
- [ ] useEffect dependencies include state the effect modifies
- [ ] Database queries in loops without limits
- [ ] Cache invalidation triggering more invalidation
- [ ] Multiple subscriptions to same data

### Warning Signs (Request More Analysis)
- [ ] More than 3 DB queries per user action
- [ ] Async operations in loops
- [ ] Complex nested async/await
- [ ] State updates in useEffect without cleanup

---

## 📝 APPROVAL PROCESS

### Phase 1 Approval Required
**Deliverables**:
- [ ] Complete system integration analysis
- [ ] Performance and database impact assessment
- [ ] Integration risk assessment with conflict detection
- [ ] Security and authorization review

**STOP**: Wait for explicit approval before Phase 2

### Phase 2 Final Approval
**Deliverables**:
- [ ] Implementation with all mandatory safeguards
- [ ] Circuit breakers and performance limits implemented
- [ ] Integration testing completed
- [ ] Performance validation passed (no infinite loops, < 3 sec operations)

**Final approval required before deployment**

---

## 🎯 KEY LESSONS FROM SUSPENSION SYSTEM FAILURE

### What Went Wrong
1. **Insufficient call graph analysis** - missed recursive cache calls
2. **useEffect dependency loops** - accountStatus triggered infinite re-renders
3. **No circuit breakers** - infinite loops crashed the system
4. **Amplified existing bugs** - made pre-existing cache issues worse

### Prevention Principles
1. **Always map call graphs** before touching AuthContext/entitlements/caching
2. **Implement circuit breakers** for any function that could recurse
3. **Avoid useEffect dependency loops** - don't include state the effect modifies
4. **Test integration scenarios** with existing systems
5. **Fix existing bugs** before adding new features

---

**Remember**: The suspension system failure taught us that insufficient analysis leads to critical bugs that take much longer to fix than proper upfront analysis. This simplified template maintains essential safeguards while reducing bureaucratic overhead.
