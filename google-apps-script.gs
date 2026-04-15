/**
 * 쿠쿠 식단 기록 앱 - Google Apps Script (v2.0)
 * 활동량 데이터 uuid 기반 수정/삭제 지원 버전
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getData') {
    return ContentService.createTextOutput(JSON.stringify(getAllData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getMemos') {
    const offset = parseInt(e.parameter.offset || 0);
    const limit = parseInt(e.parameter.limit || 10);
    return ContentService.createTextOutput(JSON.stringify({ memos: getMemos(offset, limit) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  const data = postData.data;
  
  let result = false;
  
  switch (action) {
    case 'saveMeal': result = saveMeal(data); break;
    case 'updateMeal': result = updateMeal(data); break;
    case 'deleteMeal': result = deleteMeal(data.uuid); break;
    case 'saveIngredient': result = saveIngredient(data); break;
    case 'updateIngredient': result = updateIngredient(data); break;
    case 'deleteIngredient': result = deleteIngredient(data.uuid); break;
    case 'updateBookmark': result = updateBookmark(data.uuid, data.is_bookmarked); break;
    case 'saveDiary': result = saveDiary(data); break;
    case 'saveMemo': result = saveMemo(data); break;
    case 'updateMemo': result = updateMemo(data); break;
    case 'deleteMemo': result = deleteMemo(data.id); break;
    case 'saveActivity': result = saveActivity(data); break;
    case 'updateActivity': result = updateActivity(data); break;
    case 'deleteActivity': result = deleteActivity(data.uuid); break;
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Data Fetching ---

function getAllData() {
  return {
    meals: getSheetData('meals'),
    ingredients: getSheetData('ingredients'),
    diaries: getSheetData('diaries'),
    activities: getSheetData('activity_logs')
  };
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function getMemos(offset, limit) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('memos');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).reverse(); // 최신순
  return rows.slice(offset, offset + limit).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

// --- Activity Logs (UUID Based) ---

function saveActivity(data) {
  const sheet = getOrCreateSheet('activity_logs', ['uuid', 'date', 'steps', 'active_calories', 'total_calories', 'image_url', 'created_at']);
  sheet.appendRow([
    data.uuid,
    data.date,
    data.steps,
    data.active_calories,
    data.total_calories,
    data.image_url || '',
    data.created_at || new Date().toISOString()
  ]);
  return true;
}

function updateActivity(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activity_logs');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const uuidIdx = headers.indexOf('uuid');
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === data.uuid) {
      const newRow = headers.map(h => {
        if (h === 'uuid') return data.uuid;
        if (h === 'date') return data.date;
        if (h === 'steps') return data.steps;
        if (h === 'active_calories') return data.active_calories;
        if (h === 'total_calories') return data.total_calories;
        if (h === 'image_url') return data.image_url || '';
        if (h === 'created_at') return rows[i][headers.indexOf('created_at')];
        return rows[i][headers.indexOf(h)];
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return true;
    }
  }
  return saveActivity(data); // 없으면 새로 저장
}

function deleteActivity(uuid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('activity_logs');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const uuidIdx = rows[0].indexOf('uuid');
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === uuid) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// --- Helper Functions ---

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

// --- Other Save/Update/Delete functions (생략 가능하나 구조 유지를 위해 간단히 작성) ---
// 실제 사용시 기존에 잘 작동하던 코드를 유지하면서 activity_logs 부분만 위 코드로 교체하시면 됩니다.

function saveMeal(data) {
  // 1. 헤더 순서를 [name, uuid] 순으로 변경
  const headers = ['uuid', 'type', 'status', 'date', 'time', 'ingredient_name', 'ingredient_uuid', 'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber'];
  const sheet = getOrCreateSheet('meals', headers);
  
  // 2. 입력 데이터도 헤더 순서와 똑같이 맞춤
  sheet.appendRow([
    data.uuid, 
    data.type, 
    data.status, 
    data.date, 
    data.time, 
    data.ingredient_name, // name 먼저
    data.ingredient_uuid, // uuid 나중
    data.amount, 
    data.kcal, 
    data.carbs, 
    data.protein, 
    data.fat, 
    data.sugar, 
    data.fiber
  ]);
  return true;
}

function updateMeal(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meals');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const uuidIdx = headers.indexOf('uuid');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === data.uuid) {
      const newRow = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return true;
    }
  }
  return false;
}

function deleteMeal(uuid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meals');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const uuidIdx = rows[0].indexOf('uuid');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === uuid) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function saveIngredient(data) {
  const sheet = getOrCreateSheet('ingredients', ['uuid', 'name', 'base_amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber', 'is_bookmarked']);
  sheet.appendRow([data.uuid, data.name, data.base_amount, data.kcal, data.carbs, data.protein, data.fat, data.sugar, data.fiber, data.is_bookmarked]);
  return true;
}

function updateIngredient(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ingredients');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const uuidIdx = rows[0].indexOf('uuid');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === data.uuid) {
      const headers = rows[0];
      const newRow = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return true;
    }
  }
  return false;
}

function deleteIngredient(uuid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ingredients');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const uuidIdx = rows[0].indexOf('uuid');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === uuid) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function updateBookmark(uuid, isBookmarked) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ingredients');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const uuidIdx = headers.indexOf('uuid');
  const bookmarkIdx = headers.indexOf('is_bookmarked');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][uuidIdx] === uuid) {
      sheet.getRange(i + 1, bookmarkIdx + 1).setValue(isBookmarked);
      return true;
    }
  }
  return false;
}

function saveDiary(data) {
  const sheet = getOrCreateSheet('diaries', ['uuid', 'date', 'content', 'updated_at']);
  const rows = sheet.getDataRange().getValues();
  const dateIdx = rows[0].indexOf('date');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][dateIdx] === data.date) {
      sheet.getRange(i + 1, 1, 1, 4).setValues([[data.uuid, data.date, data.content, data.updated_at]]);
      return true;
    }
  }
  sheet.appendRow([data.uuid, data.date, data.content, data.updated_at]);
  return true;
}

function saveMemo(data) {
  const sheet = getOrCreateSheet('memos', ['id', 'content', 'createdat', 'updatedat']);
  sheet.appendRow([data.id, data.content, data.createdat, data.updatedat]);
  return true;
}

function updateMemo(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('memos');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const idIdx = rows[0].indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIdx] === data.id) {
      sheet.getRange(i + 1, 2).setValue(data.content);
      sheet.getRange(i + 1, 4).setValue(data.updatedat);
      return true;
    }
  }
  return false;
}

function deleteMemo(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('memos');
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const idIdx = rows[0].indexOf('id');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIdx] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}
