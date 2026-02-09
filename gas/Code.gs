
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
  } else if (action === 'saveDiary') {
    saveDiary(data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ingredientsSheet = ss.getSheetByName('Ingredients');
  let mealsSheet = ss.getSheetByName('Meals');
  let diariesSheet = ss.getSheetByName('HealthDiaries');
  
  if (!ingredientsSheet) {
    ingredientsSheet = ss.insertSheet('Ingredients');
    ingredientsSheet.appendRow(['uuid', 'name', 'base_amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber', 'is_bookmarked']);
  }
  
  if (!mealsSheet) {
    mealsSheet = ss.insertSheet('Meals');
    mealsSheet.appendRow(['uuid', 'type', 'status', 'date', 'time', 'ingredient_name', 'ingredient_uuid', 'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber']);
  }
  
  if (!diariesSheet) {
    diariesSheet = ss.insertSheet('HealthDiaries');
    diariesSheet.appendRow(['uuid', 'date', 'content', 'updated_at']);
  }
  
  return { ingredientsSheet, mealsSheet, diariesSheet };
}

function getAllData() {
  const { ingredientsSheet, mealsSheet, diariesSheet } = getSheets();
  return { 
    ingredients: dataToJson(ingredientsSheet.getDataRange().getDisplayValues()), 
    meals: dataToJson(mealsSheet.getDataRange().getDisplayValues()),
    diaries: dataToJson(diariesSheet.getDataRange().getDisplayValues())
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
  const rowData = headers.map(header => meal[header] || '');
  mealsSheet.appendRow(rowData);
}

function saveIngredient(ing) {
  const { ingredientsSheet } = getSheets();
  ingredientsSheet.appendRow([ing.uuid, ing.name, ing.base_amount, ing.kcal, ing.carbs, ing.protein, ing.fat, ing.sugar, ing.fiber, ing.is_bookmarked || false]);
}

function saveDiary(diary) {
  const { diariesSheet } = getSheets();
  const data = diariesSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const dateIndex = headers.indexOf('date');
  
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][dateIndex]) === String(diary.date)) {
      foundRow = i + 1;
      break;
    }
  }
  
  const rowData = headers.map(h => diary[h] || '');
  if (foundRow !== -1) {
    diariesSheet.getRange(foundRow, 1, 1, headers.length).setValues([rowData]);
  } else {
    diariesSheet.appendRow(rowData);
  }
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
