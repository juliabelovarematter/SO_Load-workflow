import formbricks from '@formbricks/js'

// Initialize Formbricks (call this once in your app)
export const initializeFormbricks = async () => {
  try {
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80", // your environment ID
      appUrl: "https://app.formbricks.com",
    })
    
    // Generate a unique user ID for testing (changes on each page load)
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await formbricks.setUserId(userId)
    await formbricks.setAttribute("source", "prototype")
    await formbricks.setAttribute("testMode", "true")
    
    console.log('✅ Formbricks initialized successfully with user:', userId)
    return true
  } catch (error) {
    console.log('⚠️ Formbricks initialization failed:', error)
    return false
  }
}

// Reset user for testing (allows survey to show again)
export const resetUserForTesting = async () => {
  try {
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await formbricks.setUserId(userId)
    await formbricks.setAttribute("source", "prototype")
    await formbricks.setAttribute("testMode", "true")
    console.log('✅ User reset for testing:', userId)
    return userId
  } catch (error) {
    console.log('⚠️ Failed to reset user:', error)
    return null
  }
}

// Trigger survey function
export const triggerSurvey = async (surveyId: string, context?: Record<string, any>) => {
  try {
    console.log('Triggering survey:', surveyId)
    
    // Reset user for testing to allow survey to show again
    await resetUserForTesting()
    
    // Track the survey trigger event
    formbricks.track("survey-triggered", {
      surveyId,
      context: context || {},
      timestamp: new Date().toISOString()
    })
    
    console.log('✅ Survey trigger event sent successfully')
  } catch (error) {
    console.log('⚠️ Failed to trigger survey:', error)
  }
}

// Your survey ID
export const FEEDBACK_SURVEY_ID = "cmg5eady614awyt01kqe0i5q4"
