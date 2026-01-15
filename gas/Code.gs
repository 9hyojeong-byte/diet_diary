
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
    // status 컬럼 포함 헤더 정의
    mealsSheet.appendRow(['uuid', 'type', 'status', 'date', 'time', 'ingredient_name', 'ingredient_uuid', 'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber']);
  } else {
    // 기존 시트에 status 컬럼이 없는 경우 대응 (두 번째 열에 추가)
    const headers = mealsSheet.getRange(1, 1, 1, mealsSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('status') === -1) {
      mealsSheet.insertColumnAfter(2);
      mealsSheet.getRange(1, 3).setValue('status');
    }
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
  const headers = mealsSheet.getRange(1, 1, 1, mealsSheet.getLastColumn()).getValues()[0].map(h => h.trim().toLowerCase());
  
  const rowData = headers.map(header => {
    if (header === 'uuid') return meal.uuid;
    if (header === 'type') return meal.type;
    if (header === 'status') return meal.status || 'ACTUAL';
    if (header === 'date') return meal.date;
    if (header === 'time') return meal.time;
    if (header === 'ingredient_name') return meal.ingredient_name || '';
    if (header === 'ingredient_uuid') return meal.ingredient_uuid;
    if (header === 'amount') return meal.amount;
    if (header === 'kcal') return meal.kcal;
    if (header === 'carbs') return meal.carbs;
    if (header === 'protein') return meal.protein;
    if (header === 'fat') return meal.fat;
    if (header === 'sugar') return meal.sugar;
    if (header === 'fiber') return meal.fiber;
    return '';
  });
  
  mealsSheet.appendRow(rowData);
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
      const row = headers.map(header => {
        if (newData[header] !== undefined) return newData[header];
        return data[i][headers.indexOf(header)];
      });
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
