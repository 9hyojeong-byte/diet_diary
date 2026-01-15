
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
  } else if (action === 'updateMeal') {
    updateRowByUuid('Meals', data.uuid, data);
  } else if (action === 'deleteMeal') {
    deleteRowByUuid('Meals', data.uuid);
  } else if (action === 'saveIngredient') {
    saveIngredient(data);
  } else if (action === 'updateIngredient') {
    updateRowByUuid('Ingredients', data.uuid, data);
  } else if (action === 'deleteIngredient') {
    deleteRowByUuid('Ingredients', data.uuid);
  } else if (action === 'updateBookmark') {
    updateBookmark(data.uuid, data.is_bookmarked);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ingredientsSheet = ss.getSheetByName('Ingredients');
  let mealsSheet = ss.getSheetByName('Meals');
  
  if (!ingredientsSheet) {
    ingredientsSheet = ss.insertSheet('Ingredients');
    ingredientsSheet.appendRow(['uuid', 'name', 'base_amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber', 'is_bookmarked']);
  }
  
  if (!mealsSheet) {
    mealsSheet = ss.insertSheet('Meals');
    // ingredient_name 컬럼 추가 (기존 Meals 시트가 있다면 수동으로 한 열 추가 필요할 수 있음)
    mealsSheet.appendRow(['uuid', 'type', 'date', 'time', 'ingredient_name', 'ingredient_uuid', 'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber']);
  }
  
  return { ingredientsSheet, mealsSheet };
}

function getAllData() {
  const { ingredientsSheet, mealsSheet } = getSheets();
  const ingData = ingredientsSheet.getDataRange().getDisplayValues();
  const mealData = mealsSheet.getDataRange().getDisplayValues();
  return { 
    ingredients: dataToJson(ingData), 
    meals: dataToJson(mealData) 
  };
}

function dataToJson(data) {
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      obj[header] = (val !== null && val !== undefined) ? String(val).trim() : "";
    });
    return obj;
  });
}

function saveMeal(meal) {
  const { mealsSheet } = getSheets();
  // ingredient_name 포함하여 저장
  mealsSheet.appendRow([
    meal.uuid, 
    meal.type, 
    meal.date, 
    meal.time, 
    meal.ingredient_name || '', 
    meal.ingredient_uuid, 
    meal.amount, 
    meal.kcal, 
    meal.carbs, 
    meal.protein, 
    meal.fat, 
    meal.sugar, 
    meal.fiber
  ]);
}

function saveIngredient(ing) {
  const { ingredientsSheet } = getSheets();
  ingredientsSheet.appendRow([ing.uuid, ing.name, ing.base_amount, ing.kcal, ing.carbs, ing.protein, ing.fat, ing.sugar, ing.fiber, ing.is_bookmarked || false]);
}

function updateRowByUuid(sheetName, uuid, newData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const uuidIndex = headers.indexOf('uuid');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][uuidIndex]) === String(uuid)) {
      const row = headers.map(header => newData[header] !== undefined ? newData[header] : data[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      break;
    }
  }
}

function deleteRowByUuid(sheetName, uuid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const uuidIndex = headers.indexOf('uuid');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][uuidIndex]) === String(uuid)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function updateBookmark(uuid, isBookmarked) {
  const { ingredientsSheet } = getSheets();
  const data = ingredientsSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const uuidIndex = headers.indexOf('uuid');
  const bookmarkIndex = headers.indexOf('is_bookmarked');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][uuidIndex]) === String(uuid)) {
      ingredientsSheet.getRange(i + 1, bookmarkIndex + 1).setValue(isBookmarked);
      break;
    }
  }
}
