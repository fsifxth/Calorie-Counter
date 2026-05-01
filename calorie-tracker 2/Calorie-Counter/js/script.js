// make sure auth functions exist
if (typeof requireAuth === "function") {
  requireAuth();
}

// check if profile exists, if not redirect to setprofile
const profile = JSON.parse(localStorage.getItem("profile"));

if (!profile) {
  console.log("No profile found");
}

async function loadDashboard() {
  try {
    const userRes = await fetch(`${API}/users/me`, { headers: authHeaders() });
    const user = await userRes.json();

    const name1 = document.getElementById("userName");
    const name2 = document.getElementById("welcomeName");

    if (name1) name1.textContent = user.displayName;
    if (name2) name2.textContent = user.displayName;

  } catch (err) {
    console.log("User fetch failed");
  }
}

//calorie calculations
function calculateBMR(weight, height, age, gender) {
  return gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

function calculateTDEE(bmr, activityLevel) {
  return bmr * activityLevel;
}

// if profile exists, calculate and display calorie goals
if (profile) {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const calorieGoals = {
    'extreme-loss': Math.round(tdee - 1000),
    'loss': Math.round(tdee - 500),
    'maintenance': Math.round(tdee),
    'gain': Math.round(tdee + 500)
  };

  Object.entries(calorieGoals).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (el) el.textContent = `${val} cal/day`;
  });
}

let selectedGoal = localStorage.getItem("selectedGoal_user") || null;
let foods = JSON.parse(localStorage.getItem("foods_user") || '[]');

if (selectedGoal) {
  selectGoal(selectedGoal);
}

// Get form elements
const addFoodForm = document.getElementById("addFoodForm");
const foodNameInput = document.getElementById("foodName");
const caloriesInput = document.getElementById("calories");
const addFoodBtn = document.getElementById("addFoodBtn");
const foodList = document.getElementById("foodList");

// Enable/disable button based on form input
function updateAddFoodButtonState() {
  const isValid = foodNameInput.value.trim() !== "" && caloriesInput.value > 0 && selectedGoal;
  addFoodBtn.disabled = !isValid;
}

foodNameInput.addEventListener("input", updateAddFoodButtonState);
caloriesInput.addEventListener("input", updateAddFoodButtonState);

document.querySelectorAll('.goal-card').forEach(card => {
  card.addEventListener('click', function() {
    const goal = this.dataset.goal;
    selectGoal(goal);
    localStorage.setItem("selectedGoal_user", goal);
    updateAddFoodButtonState(); // Update button state after goal selection
  });
});

function selectGoal(goal) {
  selectedGoal = goal;

  document.querySelectorAll('.goal-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selected = document.querySelector(`[data-goal="${goal}"]`);
  if (selected) selected.classList.add('selected');
  
  updateCalorieProgress();
}

// FOOD MANAGEMENT
// Add food handler
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!selectedGoal) {
    alert("Please select a calorie goal first");
    return;
  }

  const foodName = foodNameInput.value.trim();
  const calories = parseInt(caloriesInput.value);

  if (!foodName || calories <= 0) {
    alert("Please enter valid food name and calories");
    return;
  }

  // Create food entry
  const foodEntry = {
    id: Date.now().toString(),
    name: foodName,
    calories: calories,
    timestamp: new Date().toISOString()
  };

  // Add to foods array
  foods.push(foodEntry);
  
  // Save to localStorage
  localStorage.setItem("foods_user", JSON.stringify(foods));

  // Also save to backend if token exists
  const token = localStorage.getItem("token");
  if (token) {
    try {
      await fetch(`${API}/diary/today/entries`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          foodId: foodEntry.id,
          foodName: foodName,
          calories: calories,
          quantity: 1,
          unit: "serving"
        })
      });
    } catch (err) {
      console.log("Backend save failed, data saved locally");
    }
  }

  // Clear form and refresh list
  foodNameInput.value = "";
  caloriesInput.value = "";
  updateAddFoodButtonState();
  displayFoodList();
  updateCalorieProgress();
});

// Display food list
function displayFoodList() {
  if (foods.length === 0) {
    foodList.innerHTML = '<p class="empty-state">No foods logged yet. Add your first meal above!</p>';
    return;
  }

  foodList.innerHTML = foods.map(food => `
    <div class="food-item">
      <div class="food-info">
        <span class="food-name">${food.name}</span>
        <span class="food-calories">${food.calories} cal</span>
      </div>
      <button class="food-delete-btn" onclick="deleteFood('${food.id}')">Remove</button>
    </div>
  `).join("");
}

// Delete food
function deleteFood(foodId) {
  foods = foods.filter(f => f.id !== foodId);
  localStorage.setItem("foods_user", JSON.stringify(foods));
  displayFoodList();
  updateCalorieProgress();
}

// Update calorie progress
function updateCalorieProgress() {
  if (!selectedGoal || !profile) return;

  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const calorieGoals = {
    'extreme-loss': Math.round(tdee - 1000),
    'loss': Math.round(tdee - 500),
    'maintenance': Math.round(tdee),
    'gain': Math.round(tdee + 500)
  };

  const targetCalories = calorieGoals[selectedGoal];
  const consumedCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const remainingCalories = targetCalories - consumedCalories;
  const percentage = Math.round((consumedCalories / targetCalories) * 100);

  document.getElementById("consumedCalories").textContent = consumedCalories;
  document.getElementById("targetCalories").textContent = targetCalories;
  document.getElementById("remainingCalories").textContent = Math.max(0, remainingCalories);
  document.getElementById("percentageConsumed").textContent = Math.min(100, percentage) + "%";
  document.getElementById("selectedGoalText").textContent = `Goal: ${selectedGoal.replace('-', ' ')} - ${targetCalories} cal/day`;

  const progressBar = document.getElementById("progressBar");
  const barPercentage = Math.min(100, percentage);
  progressBar.style.width = barPercentage + "%";
  if (percentage < 100) {
    progressBar.style.backgroundColor = "#4CAF50";
  } else if (percentage < 110) {
    progressBar.style.backgroundColor = "#FFC107";
  } else {
    progressBar.style.backgroundColor = "#FF6B6B";
  }
}

// Initial display
displayFoodList();
updateAddFoodButtonState(); // Initialize button state
loadDashboard();
