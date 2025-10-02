window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
window.Script1 = function()
{
  window.ventilatorBasic.start()  // Start inspiration
}

window.Script2 = function()
{
  window.ventilatorBasic.start()  // Start inspiration
}

window.Script3 = function()
{
  window.ventilatorBasic.start()  // Start inspiration
}

window.Script4 = function()
{
  // =============================================================================
// MECHANICAL VENTILATOR WATER MODEL - BASIC CONFIGURATION
// Step 2: Animation of water flow from Reservoir to Tank
// Fixed version with proper gradient positioning and equilibrium
// =============================================================================

// Configuration Constants (inherited from Step 1)
const CONFIG = {
    // Configuration selection
    CONFIGURATION: "Basic",
    
    // Pressure settings (cmH2O)
    STARTING_PRESSURE_RESERVOIR: 30,
    STARTING_PRESSURE_TANK: 5,
    
    // Resistance settings (cmH2O/L/s)
    INSPIRATORY_RESISTANCE: 10,
    
    // Timing settings (ms)
    INSPIRATORY_TIME: 3000,
    EXPIRATORY_TIME: 2000,
    
    // Animation settings
    CYCLES: 0.5,  // For Basic config: 0.5 = one inspiration only
    
    // Unit conversion
    CM_H2O_TO_PIXELS: 10,
    MAX_WATER_HEIGHT: 30
};

// Object visibility map (from Step 1)
const OBJECT_VISIBILITY = {
    "Basic": {
        show: ["WaterReservoir", "WaterTank", "Inspi", "Gradient", "BubblesConnection"],
        hide: ["Port", "Expi", "WaterPort", "WaterExpi", "BubblesExpi", 
               "Faucet", "WaterFaucet", "BubblesFaucet"]
    }
};

// Global variables
let objects = {};
let elements = {};
let originalPositions = {};
let baseline = null;

// Animation state
let animationId = null;
let isAnimating = false;
let animationStartTime = null;
let currentPressureReservoir = CONFIG.STARTING_PRESSURE_RESERVOIR;
let currentPressureTank = CONFIG.STARTING_PRESSURE_TANK;
let equilibriumPressure = 0;
let initialGradient = 0;

/**
 * Get Storyline API object (reused from Step 1)
 */
function getStorylineObject(altTextName) {
    try {
        const element = document.querySelector(`[data-acc-text="${altTextName}"]`);
        if (!element) return null;
        
        const objectId = element.getAttribute('data-model-id');
        if (!objectId) return null;
        
        const apiObject = object(objectId);
        if (apiObject) {
            elements[altTextName] = element;
            console.log(`✓ Found object: ${altTextName}`);
        }
        return apiObject;
    } catch (error) {
        console.error(`❌ Error accessing object ${altTextName}:`, error);
        return null;
    }
}

/**
 * Apply visibility settings to hide unnecessary objects IMMEDIATELY
 */
function applyVisibilitySettings() {
    const visibility = OBJECT_VISIBILITY[CONFIG.CONFIGURATION];
    
    // Hide objects immediately before any console logging
    for (const objName of visibility.hide) {
        const element = document.querySelector(`[data-acc-text="${objName}"]`);
        if (element) {
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
        }
    }
    
    console.log("👁️ Applying visibility settings for Basic configuration...");
    
    // Log what was hidden
    for (const objName of visibility.hide) {
        const element = document.querySelector(`[data-acc-text="${objName}"]`);
        if (element) {
            console.log(`   ✓ Hidden: ${objName}`);
        }
    }
    
    // Ensure required objects are visible
    for (const objName of visibility.show) {
        if (elements[objName]) {
            elements[objName].style.opacity = '1';
            elements[objName].style.pointerEvents = 'auto';
        }
    }
}

/**
 * Initialize objects and store original positions
 */
function initializeObjects() {
    console.log("📋 Loading objects for animation...");
    
    // Get required objects
    const requiredObjects = [
        "WaterReservoir", "WaterTank", "Inspi", 
        "Gradient", "BubblesConnection"
    ];
    
    for (const name of requiredObjects) {
        objects[name] = getStorylineObject(name);
        if (!objects[name]) {
            console.error(`❌ Missing required object: ${name}`);
            return false;
        }
    }
    
    // Store original positions
    for (const [name, apiObj] of Object.entries(objects)) {
        originalPositions[name] = {
            x: apiObj.x,
            y: apiObj.y,
            width: apiObj.width,
            height: apiObj.height,
            rotation: apiObj.rotation || 0
        };
    }
    
    // Calculate baseline
    baseline = objects.WaterReservoir.y + objects.WaterReservoir.height;
    console.log(`📏 Baseline: ${baseline.toFixed(1)}px`);
    
    // Apply visibility settings to hide unnecessary objects
    applyVisibilitySettings();
    
    return true;
}

/**
 * Calculate equilibrium pressure between Reservoir and Tank
 */
function calculateEquilibrium() {
    // Equilibrium = average of the two pressures
    equilibriumPressure = (currentPressureReservoir + currentPressureTank) / 2;
    initialGradient = currentPressureReservoir - currentPressureTank;
    
    console.log(`⚖️ Equilibrium calculation:`);
    console.log(`   Reservoir: ${currentPressureReservoir} cmH2O`);
    console.log(`   Tank: ${currentPressureTank} cmH2O`);
    console.log(`   Equilibrium: ${equilibriumPressure.toFixed(1)} cmH2O`);
    console.log(`   Initial gradient: ${initialGradient.toFixed(1)} cmH2O`);
}

/**
 * Open the Inspiratory valve with animation
 */
function openInspiValve() {
    if (objects.Inspi && !objects.Inspi.isAnimating) {
        objects.Inspi.isAnimating = true;
        const startY = originalPositions.Inspi.y;
        const endY = originalPositions.Inspi.y - 27;
        const duration = 200; // 0.2 seconds
        const startTime = Date.now();
        
        function animateValve() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing for smooth movement
            const easedProgress = 1 - Math.pow(1 - progress, 2); // Ease-out quad
            objects.Inspi.y = startY + (endY - startY) * easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateValve);
            } else {
                objects.Inspi.isAnimating = false;
                console.log("🔓 Inspi valve opened");
            }
        }
        animateValve();
    }
}

/**
 * Close the Inspiratory valve with animation
 */
function closeInspiValve() {
    if (objects.Inspi && !objects.Inspi.isAnimating) {
        objects.Inspi.isAnimating = true;
        const startY = objects.Inspi.y;
        const endY = originalPositions.Inspi.y;
        const duration = 200; // 0.2 seconds
        const startTime = Date.now();
        
        function animateValve() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing for smooth movement
            const easedProgress = 1 - Math.pow(1 - progress, 2); // Ease-out quad
            objects.Inspi.y = startY + (endY - startY) * easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateValve);
            } else {
                objects.Inspi.isAnimating = false;
                console.log("🔒 Inspi valve closed");
            }
        }
        animateValve();
    }
}

/**
 * Update water levels based on flow
 */
function updateWaterLevels(progress) {
    // FIXED: Force exact equilibrium at progress = 1
    if (progress >= 1) {
        // Set both to exact equilibrium
        currentPressureReservoir = equilibriumPressure;
        currentPressureTank = equilibriumPressure;
    } else {
        // Use exponential decay for smooth animation
        const exponentialFactor = 1 - Math.exp(-5 * progress);
        
        // Calculate current pressures
        const pressureChange = initialGradient / 2 * exponentialFactor;
        currentPressureReservoir = CONFIG.STARTING_PRESSURE_RESERVOIR - pressureChange;
        currentPressureTank = CONFIG.STARTING_PRESSURE_TANK + pressureChange;
    }
    
    // Update Reservoir position
    const reservoirYAdjustment = (CONFIG.MAX_WATER_HEIGHT - currentPressureReservoir) * CONFIG.CM_H2O_TO_PIXELS;
    objects.WaterReservoir.y = originalPositions.WaterReservoir.y + reservoirYAdjustment;
    
    // Update Tank position
    const tankYAdjustment = (CONFIG.MAX_WATER_HEIGHT - currentPressureTank) * CONFIG.CM_H2O_TO_PIXELS;
    objects.WaterTank.y = originalPositions.WaterTank.y + tankYAdjustment;
    
    // Log current state (only at key points to avoid spam)
    if (progress === 0 || progress === 1 || Math.round(progress * 10) / 10 === progress) {
        console.log(`💧 Water levels at ${(progress * 100).toFixed(0)}%:`);
        console.log(`   Reservoir: ${currentPressureReservoir.toFixed(1)} cmH2O`);
        console.log(`   Tank: ${currentPressureTank.toFixed(1)} cmH2O`);
        console.log(`   Difference: ${Math.abs(currentPressureReservoir - currentPressureTank).toFixed(2)} cmH2O`);
    }
}

/**
 * Update gradient arrow angle and position
 */
function updateGradient() {
    if (!objects.Gradient) return;
    
    // Calculate actual water surface positions
    const reservoirWaterSurface = objects.WaterReservoir.y;
    const tankWaterSurface = objects.WaterTank.y;
    
    // Calculate height difference for angle
    const reservoirCenterX = objects.WaterReservoir.x + (objects.WaterReservoir.width / 2);
    const tankCenterX = objects.WaterTank.x + (objects.WaterTank.width / 2);
    const heightDifference = tankWaterSurface - reservoirWaterSurface;
    const horizontalDistance = tankCenterX - reservoirCenterX;
    
    // Calculate angle in degrees
    const angleRadians = Math.atan2(heightDifference, horizontalDistance);
    const angleDegrees = angleRadians * (180 / Math.PI);
    
    // FIXED: Keep X constant (use original position), only adjust Y
    const centerY = (reservoirWaterSurface + tankWaterSurface) / 2;
    
    // Keep original X, update Y for average water level, apply rotation
    objects.Gradient.x = originalPositions.Gradient.x;
    objects.Gradient.y = centerY - (objects.Gradient.height / 2);
    objects.Gradient.rotation = angleDegrees;
    
    // Debug log for gradient positioning (only occasionally)
    if (Math.random() < 0.1) { // Log 10% of the time
        console.log(`📐 Gradient: Angle=${angleDegrees.toFixed(1)}°, Position=(${objects.Gradient.x.toFixed(0)}, ${objects.Gradient.y.toFixed(0)}), CenterY=${centerY.toFixed(0)}`);
    }
}

/**
 * Animate bubbles in connection with deceleration at double speed
 */
function animateBubbles(progress) {
    if (!objects.BubblesConnection) return;
    
    // Apply exponential deceleration similar to water flow but at double speed
    // This makes bubbles flow faster in the narrower connection
    const exponentialFactor = 1 - Math.exp(-10 * progress); // Double speed (-10 instead of -5)
    
    // Move bubbles from left to right with deceleration
    const totalMovement = 200; // pixels
    const currentMovement = totalMovement * exponentialFactor;
    
    // Update position with decelerating movement
    objects.BubblesConnection.x = originalPositions.BubblesConnection.x + currentMovement;
    
    // Keep bubbles at final position (removed reset)
}

/**
 * Calculate instantaneous flow rate
 */
function calculateFlowRate() {
    const pressureDifference = currentPressureReservoir - currentPressureTank;
    const flowRate = pressureDifference / CONFIG.INSPIRATORY_RESISTANCE;
    return flowRate;
}

/**
 * Main animation loop
 */
function animateInspiration(timestamp) {
    if (!animationStartTime) {
        animationStartTime = timestamp;
    }
    
    const elapsed = timestamp - animationStartTime;
    const progress = Math.min(elapsed / CONFIG.INSPIRATORY_TIME, 1);
    
    // Update all animated elements
    updateWaterLevels(progress);
    updateGradient();
    animateBubbles(progress);
    
    // Calculate and display flow rate (at intervals)
    if (Math.round(progress * 20) / 20 === progress) {
        const flowRate = calculateFlowRate();
        console.log(`🌊 Flow rate: ${flowRate.toFixed(2)} L/s`);
    }
    
    // Continue animation or stop at equilibrium
    if (progress < 1 && isAnimating) {
        animationId = requestAnimationFrame(animateInspiration);
    } else {
        // Animation complete - equilibrium reached
        console.log("✅ Equilibrium reached!");
        console.log(`   Final Reservoir: ${currentPressureReservoir.toFixed(1)} cmH2O`);
        console.log(`   Final Tank: ${currentPressureTank.toFixed(1)} cmH2O`);
        console.log(`   Final difference: ${Math.abs(currentPressureReservoir - currentPressureTank).toFixed(3)} cmH2O`);
        
        // FIXED: Keep valve OPEN at equilibrium (removed closeInspiValve)
        console.log("   Valve remains OPEN at equilibrium");
        
        isAnimating = false;
        
        // Keep bubbles visible (removed opacity change)
    }
}

/**
 * Start the inspiration animation
 */
function startInspiration() {
    if (isAnimating) {
        console.log("⚠️ Animation already in progress");
        return;
    }
    
    console.log("\n🚀 STARTING INSPIRATION ANIMATION");
    console.log("=====================================");
    
    // Calculate equilibrium point
    calculateEquilibrium();
    
    // Open valve
    openInspiValve();
    
    // Reset animation state
    animationStartTime = null;
    isAnimating = true;
    
    // Start animation
    animationId = requestAnimationFrame(animateInspiration);
}

/**
 * Stop the animation
 */
function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    isAnimating = false;
    // Note: Valve state is not changed on stop
    console.log("⏹️ Animation stopped");
}

/**
 * Reset to starting positions
 */
function resetAnimation() {
    stopAnimation();
    
    // Reset water levels to starting positions
    currentPressureReservoir = CONFIG.STARTING_PRESSURE_RESERVOIR;
    currentPressureTank = CONFIG.STARTING_PRESSURE_TANK;
    
    // Reset Reservoir
    const reservoirYAdjustment = (CONFIG.MAX_WATER_HEIGHT - currentPressureReservoir) * CONFIG.CM_H2O_TO_PIXELS;
    objects.WaterReservoir.y = originalPositions.WaterReservoir.y + reservoirYAdjustment;
    
    // Reset Tank
    const tankYAdjustment = (CONFIG.MAX_WATER_HEIGHT - currentPressureTank) * CONFIG.CM_H2O_TO_PIXELS;
    objects.WaterTank.y = originalPositions.WaterTank.y + tankYAdjustment;
    
    // Reset gradient
    updateGradient();
    
    // Reset bubbles position (keep visible)
    if (objects.BubblesConnection) {
        objects.BubblesConnection.x = originalPositions.BubblesConnection.x;
    }
    
    // Close valve
    closeInspiValve();
    
    console.log("🔄 Animation reset to starting position");
}

/**
 * Immediately hide objects before full initialization
 */
function immediateSetup() {
    // Hide unnecessary objects immediately
    const objectsToHide = ["Port", "Expi", "WaterPort", "WaterExpi", "BubblesExpi", 
                          "Faucet", "WaterFaucet", "BubblesFaucet"];
    
    for (const objName of objectsToHide) {
        const element = document.querySelector(`[data-acc-text="${objName}"]`);
        if (element) {
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
        }
    }
}

/**
 * Main initialization
 */
function initializeBasicConfiguration() {
    console.log("🔧 MECHANICAL VENTILATOR - BASIC CONFIGURATION");
    console.log("=====================================\n");
    
    if (!initializeObjects()) {
        console.error("❌ Failed to initialize objects");
        return;
    }
    
    // Set initial water levels (from Step 1 configuration)
    resetAnimation();
    
    console.log("✅ Basic Configuration initialized");
    console.log("\n📌 Use controls to start animation:");
    console.log("   window.ventilatorBasic.start()");
    console.log("   window.ventilatorBasic.stop()");
    console.log("   window.ventilatorBasic.reset()");
}

// Hide objects immediately, then initialize right away
immediateSetup();
initializeBasicConfiguration();

// Export controls
window.ventilatorBasic = {
    start: startInspiration,
    stop: stopAnimation,
    reset: resetAnimation,
    
    // Manual valve control
    openValve: openInspiValve,
    closeValve: closeInspiValve,
    
    // Status check
    status: () => {
        console.log("\n📊 Current Status:");
        console.log(`   Animating: ${isAnimating}`);
        console.log(`   Reservoir: ${currentPressureReservoir.toFixed(1)} cmH2O`);
        console.log(`   Tank: ${currentPressureTank.toFixed(1)} cmH2O`);
        console.log(`   Gradient: ${Math.abs(currentPressureReservoir - currentPressureTank).toFixed(2)} cmH2O`);
        console.log(`   Flow rate: ${calculateFlowRate().toFixed(2)} L/s`);
        console.log(`   Valve: ${objects.Inspi && objects.Inspi.y < originalPositions.Inspi.y ? 'OPEN' : 'CLOSED'}`);
    }
};
}

window.Script5 = function()
{
  window.ventilatorBasic.start()  // Start inspiration
}

window.Script6 = function()
{
  window.ventilatorBasic.reset()  // Reset to starting position
}

window.Script7 = function()
{
  window.ventilatorBasic.start()  // Start inspiration
}

};
