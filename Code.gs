function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getData') {
    return ContentService.createTextOutput(JSON.stringify(getAllData()))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getMemos') {
    const offset = parseInt(e.parameter.offset) || 0;
    const limit = parseInt(e.parameter.limit) || 10;
    return ContentService.createTextOutput(JSON.stringify({ memos: getMemos(offset, limit) }))
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
    updateRowByKey('Meals', 'uuid', data.uuid, data);
  } else if (action === 'deleteMeal') {
    deleteRowByKey('Meals', 'uuid', data.uuid);
  } else if (action === 'saveIngredient') {
    saveIngredient(data);
  } else if (action === 'updateIngredient') {
    updateRowByKey('Ingredients', 'uuid', data.uuid, data);
  } else if (action === 'deleteIngredient') {
    deleteRowByKey('Ingredients', 'uuid', data.uuid);
  } else if (action === 'updateBookmark') {
    updateBookmark(data.uuid, data.is_bookmarked);
  } else if (action === 'saveDiary') {
    saveDiary(data);
  } else if (action === 'saveMemo') {
    saveMemo(data);
  } else if (action === 'updateMemo') {
    updateRowByKey('Memos', 'id', data.id, data);
  } else if (action === 'deleteMemo') {
    deleteRowByKey('Memos', 'id', data.id);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ingredientsSheet = ss.getSheetByName('Ingredients');
  let mealsSheet = ss.getSheetByName('Meals');
  let diariesSheet = ss.getSheetByName('HealthDiaries');
  let memosSheet = ss.getSheetByName('Memos');
  
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

  if (!memosSheet) {
    memosSheet = ss.insertSheet('Memos');
    memosSheet.appendRow(['id', 'content', 'createdAt', 'updatedAt']);
  }
  
  return { ingredientsSheet, mealsSheet, diariesSheet, memosSheet };
}

function getAllData() {
  const { ingredientsSheet, mealsSheet, diariesSheet } = getSheets();
  return { 
    ingredients: dataToJson(ingredientsSheet.getDataRange().getDisplayValues()), 
    meals: dataToJson(mealsSheet.getDataRange().getDisplayValues()),
    diaries: dataToJson(diariesSheet.getDataRange().getDisplayValues())
  };
}

function getMemos(offset, limit) {
  const { memosSheet } = getSheets();
  const data = memosSheet.getDataRange().getDisplayValues();
  const allMemos = dataToJson(data);
  
  // 최신 수정일 기준으로 내림차순 정렬
  allMemos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  // 페이징 처리하여 반환
  return allMemos.slice(offset, offset + limit);
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

function saveMemo(memo) {
  const { memosSheet } = getSheets();
  const headers = memosSheet.getRange(1, 1, 1, memosSheet.getLastColumn()).getValues()[0].map(h => h.trim().toLowerCase());
  const rowData = headers.map(header => memo[header] || '');
  memosSheet.appendRow(rowData);
}

// 공통 업데이트 함수 (uuid 또는 id 등 특정 키를 기준으로 업데이트)
function updateRowByKey(sheetName, keyColumn, keyValue, newData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const keyIndex = headers.indexOf(keyColumn.toLowerCase());
  if (keyIndex === -1) return;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      const row = headers.map(header => {
        if (newData[header] !== undefined) return newData[header];
        return data[i][headers.indexOf(header)];
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      break;
    }
  }
}

// 공통 삭제 함수
function deleteRowByKey(sheetName, keyColumn, keyValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const keyIndex = headers.indexOf(keyColumn.toLowerCase());
  if (keyIndex === -1) return;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
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
