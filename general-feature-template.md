# 🎯 GENERAL FEATURE IMPLEMENTATION TEMPLATE

**Universal template for all feature requests with automatic risk classification and scaled analysis requirements.**

---

## 📋 FEATURE REQUEST

### Feature Name: **[FEATURE_NAME]**
### Description: **[DETAILED_FEATURE_DESCRIPTION]**

---

## 🚦 AUTOMATIC RISK CLASSIFICATION

**Check all that apply to determine analysis depth required:**

### 🔴 HIGH RISK INDICATORS (Any = High Risk → Use Comprehensive Template)
- [ ] Modifies AuthContext or authentication flow
- [ ] Changes entitlements or permission systems
- [ ] Affects caching mechanisms or cache invalidation
- [ ] Adds real-time subscriptions or WebSocket connections
- [ ] Modifies database schema or critical tables
- [ ] Changes user session handling
- [ ] Affects security policies or access control
- [ ] Integrates with external authentication providers

**→ If ANY high-risk indicators checked, use `high-risk-feature-implementation-template.md`**

### 🟡 MEDIUM RISK INDICATORS (2+ = Medium Risk)
- [ ] Adds new API endpoints or modifies existing ones
- [ ] Changes shared state or React context (non-Auth)
- [ ] Adds database queries or mutations
- [ ] Modifies routing or navigation
- [ ] Integrates with external services
- [ ] Affects user data or profile information
- [ ] Changes form validation or submission logic
- [ ] Adds new components with complex state management

### 🟢 LOW RISK INDICATORS (All others)
- [ ] Pure UI/styling changes
- [ ] Static content updates
- [ ] Isolated component modifications
- [ ] Simple utility functions
- [ ] Documentation updates

---

## 📊 ANALYSIS REQUIREMENTS BY RISK LEVEL

### 🔴 HIGH RISK → Use Comprehensive Template
**Required**: Full four-phase analysis with comprehensive context gathering.
**Template**: `high-risk-feature-implementation-template.md`
**Reason**: Prevents critical system failures like the suspension system infinite recursion bug.

### 🟡 MEDIUM RISK → Streamlined Analysis Required

#### Required Analysis
**System Integration Check**:
- [ ] Map functions this feature will interact with
- [ ] Check for potential state conflicts
- [ ] Identify database operations and performance impact
- [ ] Plan error handling strategy

**Implementation Requirements**:
- [ ] Add error boundaries and timeout mechanisms
- [ ] Include performance monitoring
- [ ] Plan rollback capability
- [ ] Test integration with existing systems

**Approval Gate**: Wait for approval after analysis before implementation.

### 🟢 LOW RISK → Basic Implementation

#### Minimal Requirements
- [ ] Verify component isolation (no shared state impact)
- [ ] Add basic error handling
- [ ] Include standard testing
- [ ] Document any props/state changes

**Implementation**: May proceed directly with basic safeguards.

---

## 🔍 MEDIUM RISK ANALYSIS TEMPLATE

*Use this section if classified as Medium Risk*

### Integration Analysis Required

#### System Interaction Check
**Questions to Answer**:
1. What existing components/functions will this feature interact with?
2. Does this feature modify any shared state or context?
3. How many database queries will this add per user action?
4. Are there any existing performance issues this could affect?

#### State & Data Flow Analysis
**Required Documentation**:
- [ ] Map data flow from user action to database/API
- [ ] Identify all state changes this feature introduces
- [ ] Check for potential race conditions or conflicts
- [ ] Plan caching strategy if applicable

#### Performance Assessment
**Required Analysis**:
- [ ] Estimate database query load
- [ ] Identify any operations that could be expensive
- [ ] Plan for error scenarios and timeouts
- [ ] Consider impact on existing system performance

### Implementation Safeguards for Medium Risk

#### Required Safeguards
- [ ] Comprehensive error handling with try-catch blocks
- [ ] Timeout mechanisms for API calls (5 second max)
- [ ] Loading states and user feedback
- [ ] Graceful degradation for service failures
- [ ] Basic performance monitoring

#### Testing Requirements
- [ ] Unit tests for new functions
- [ ] Integration testing with affected systems
- [ ] Performance testing (operations < 3 seconds)
- [ ] Error scenario testing

---

## 🛡️ UNIVERSAL SAFEGUARDS (All Risk Levels)

### Essential Safeguards (Always Required)
- [ ] Input validation and sanitization
- [ ] Error boundaries for UI components
- [ ] Proper TypeScript typing
- [ ] Accessibility considerations
- [ ] Basic security checks

### Performance Safeguards
- [ ] Avoid operations in render loops
- [ ] Use React.memo/useMemo for expensive operations
- [ ] Implement proper loading states
- [ ] Add timeout mechanisms for async operations

---

## 🚨 RED FLAG DETECTION (All Risk Levels)

### Universal Red Flags (Stop Implementation)
- [ ] Function calls itself directly or indirectly
- [ ] useEffect dependencies include state modified by the effect
- [ ] Database queries inside loops without limits
- [ ] No error handling for external service calls
- [ ] Memory leaks (missing cleanup functions)

### Escalation Triggers (Upgrade to High Risk)
If during implementation you discover:
- [ ] Need to modify AuthContext or authentication
- [ ] Need to change caching or entitlements systems
- [ ] Need to add real-time subscriptions
- [ ] Performance issues requiring complex optimization

**→ STOP and reclassify as High Risk using comprehensive template**

---

## 📝 IMPLEMENTATION PROCESS BY RISK LEVEL

### 🔴 High Risk Process
1. **Use comprehensive template** (`high-risk-feature-implementation-template.md`)
2. **Four-phase approval process** with detailed analysis
3. **Mandatory circuit breakers** and performance safeguards
4. **Comprehensive testing** before deployment

### 🟡 Medium Risk Process
1. **Complete integration analysis** (above)
2. **Wait for approval** after analysis
3. **Implement with required safeguards**
4. **Test integration** with existing systems
5. **Final approval** after testing

### 🟢 Low Risk Process
1. **Verify component isolation**
2. **Implement with basic safeguards**
3. **Add standard testing**
4. **Deploy with monitoring**

---

## 🎯 CONTEXT ANALYSIS METHODOLOGY

*Apply appropriate depth based on risk level*

### Call Graph Analysis (High/Medium Risk)
**Purpose**: Prevent infinite recursion like suspension system failure
**Method**: 
1. Map all functions the feature will call
2. Map all functions that will call the feature
3. Identify any circular patterns
4. Check for recursive cache invalidation

### Integration Assessment (High/Medium Risk)
**Purpose**: Prevent conflicts with existing systems
**Method**:
1. Identify all systems that share data with this feature
2. Check for overlapping responsibilities
3. Verify no conflicting real-time subscriptions
4. Test with existing cache scenarios

### Performance Analysis (All Risk Levels)
**Purpose**: Maintain system performance
**Method**:
1. Count database queries per user action
2. Identify expensive operations
3. Plan caching and optimization
4. Set performance benchmarks

---

## ✅ APPROVAL CHECKLIST

### Before Implementation (Medium/High Risk)
- [ ] Risk level correctly classified
- [ ] Required analysis completed for risk level
- [ ] Integration conflicts identified and resolved
- [ ] Performance impact assessed and acceptable
- [ ] Security implications reviewed

### Before Deployment (All Risk Levels)
- [ ] All required safeguards implemented
- [ ] Testing completed for risk level
- [ ] Performance benchmarks met
- [ ] Error handling verified
- [ ] Rollback capability confirmed

---

## 📚 LESSONS LEARNED REFERENCE

### Suspension System Failure Key Lessons
1. **Insufficient context analysis** leads to critical bugs
2. **useEffect dependency loops** cause infinite re-renders
3. **Missing circuit breakers** allow infinite recursion
4. **Amplifying existing bugs** makes problems worse

### Prevention Principles
1. **Scale analysis to risk level** - don't over-analyze simple features
2. **Always check for recursion** in functions that could loop
3. **Implement safeguards appropriate to risk**
4. **Test integration scenarios** with existing systems

---

**Usage Instructions**: 
1. Fill in feature name and description
2. Check risk indicators to classify feature
3. Use appropriate analysis depth for risk level
4. Follow implementation process for classified risk level
5. Escalate to higher risk template if needed during implementation
