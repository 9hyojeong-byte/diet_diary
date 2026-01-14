
function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getData') {
    return ContentService.createTextOutput(JSON.stringify(getAllData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('Hello GAS Backend');
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const data = body.data;
  
  if (action === 'saveMeal') {
    saveMeal(data);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'updateMeal') {
    updateMeal(data);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'deleteMeal') {
    deleteMeal(data.uuid);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'saveIngredient') {
    saveIngredient(data);
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ingredientsSheet = ss.getSheetByName('Ingredients') || ss.insertSheet('Ingredients');
  let mealsSheet = ss.getSheetByName('Meals') || ss.insertSheet('Meals');
  return { ingredientsSheet, mealsSheet };
}

function getAllData() {
  const { ingredientsSheet, mealsSheet } = getSheets();
  const ingData = ingredientsSheet.getDataRange().getDisplayValues();
  const mealData = mealsSheet.getDataRange().getDisplayValues();
  return { ingredients: dataToJson(ingData), meals: dataToJson(mealData) };
}

function dataToJson(data) {
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ? String(row[i]).trim() : "";
    });
    return obj;
  });
}

function saveMeal(meal) {
  const { mealsSheet } = getSheets();
  mealsSheet.appendRow([meal.uuid, meal.type, meal.date, meal.time, meal.ingredient_uuid, meal.amount, meal.kcal, meal.carbs, meal.protein, meal.fat, meal.sugar, meal.fiber]);
}

function updateMeal(meal) {
  const { mealsSheet } = getSheets();
  const data = mealsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == meal.uuid) {
      const row = i + 1;
      mealsSheet.getRange(row, 1, 1, 12).setValues([[
        meal.uuid, meal.type, meal.date, meal.time, meal.ingredient_uuid, meal.amount, meal.kcal, meal.carbs, meal.protein, meal.fat, meal.sugar, meal.fiber
      ]]);
      break;
    }
  }
}

function deleteMeal(uuid) {
  const { mealsSheet } = getSheets();
  const data = mealsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == uuid) {
      mealsSheet.deleteRow(i + 1);
      break;
    }
  }
}

function saveIngredient(ing) {
  const { ingredientsSheet } = getSheets();
  ingredientsSheet.appendRow([ing.uuid, ing.name, ing.base_amount, ing.kcal, ing.carbs, ing.protein, ing.fat, ing.sugar, ing.fiber]);
}
