import formbricks from '@formbricks/js'

// Initialize Formbricks
export const initializeFormbricks = async () => {
  try {
    console.log('🔄 Initializing Formbricks...')
    console.log('Formbricks import:', formbricks)
    console.log('Formbricks type:', typeof formbricks)
    
    if (!formbricks) {
      throw new Error('Formbricks import is null/undefined')
    }
    
    await formbricks.setup({
      environmentId: "cmfy9tv371mlnx801lfcjfy80",
      appUrl: "https://app.formbricks.com",
    })
    console.log('✅ Formbricks initialized successfully')
    console.log('Formbricks instance:', formbricks)
  } catch (error) {
    console.log('⚠️ Formbricks initialization failed:', error)
  }
}

// Trigger survey
export const triggerSurvey = async (surveyId: string, cssSelector?: string) => {
  try {
    console.log('🔄 Triggering survey:', surveyId)
    console.log('CSS Selector:', cssSelector)
    console.log('Formbricks instance available:', !!formbricks)
    
    // Check if Formbricks is initialized
    if (!formbricks || !formbricks.track) {
      throw new Error('Formbricks not initialized or track method not available')
    }
    
    // Try different approaches based on the survey ID
    if (surveyId === "cmg6z3ito68osvm01qbqf6n8c") {
      // Load page - try different action names
      console.log('🔄 Load page detected, trying different action names')
      
      // Method 1: Try with "load-feedback-clicked"
      try {
        await formbricks.track("load-feedback-clicked")
        console.log('✅ Load survey triggered with "load-feedback-clicked"')
        return
      } catch (e) {
        console.log('⚠️ Method 1 failed, trying method 2')
      }
      
      // Method 2: Try with "give-feedback-load"
      try {
        await formbricks.track("give-feedback-load")
        console.log('✅ Load survey triggered with "give-feedback-load"')
        return
      } catch (e) {
        console.log('⚠️ Method 2 failed, trying method 3')
      }
      
      // Method 3: Try with CSS selector without dot
      try {
        await formbricks.track("load-detail-give-feedback-button")
        console.log('✅ Load survey triggered with "load-detail-give-feedback-button"')
        return
      } catch (e) {
        console.log('⚠️ Method 3 failed, trying method 4')
      }
      
      // Method 4: Try with generic action
      try {
        await formbricks.track("feedback-clicked")
        console.log('✅ Load survey triggered with "feedback-clicked"')
        return
      } catch (e) {
        console.log('⚠️ All Load methods failed')
      }
    } else {
      // SO page - use original approach
      const actionName = cssSelector || ".so-give-feedback-button"
      await formbricks.track(actionName, { 
        hiddenFields: {
          surveyId: surveyId
        } 
      })
      console.log('✅ SO survey trigger event sent successfully with action:', actionName)
    }
  } catch (error) {
    console.log('⚠️ Failed to trigger survey:', error)
  }
}

// Survey ID for SO Give Feedback
export const SO_FEEDBACK_SURVEY_ID = "cmg5eady614awyt01kqe0i5q4"

// Survey ID for Load Give Feedback
export const LOAD_FEEDBACK_SURVEY_ID = "cmg6z3ito68osvm01qbqf6n8c"

// Reset user to see survey again
export const resetUserForSurvey = async () => {
  try {
    console.log('🔄 Resetting Formbricks user...')
    
    // Logout current user
    if (formbricks && formbricks.logout) {
      await formbricks.logout()
      console.log('✅ User logged out')
    }
    
    // Clear Formbricks storage
    const formbricksKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('formbricks') || key.startsWith('fb_')
    )
    formbricksKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Clear session storage
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('formbricks') || key.startsWith('fb_')
    )
    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key)
    })
    
    console.log('✅ Formbricks user reset - survey will show again')
    
    // Reinitialize with new user
    await initializeFormbricks()
    
  } catch (error) {
    console.log('⚠️ Failed to reset user:', error)
  }
}
