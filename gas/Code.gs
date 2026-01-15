
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
  } else if (action === 'saveIngredient') {
    saveIngredient(data);
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
  } else {
    // 컬럼 보강 (기존 데이터 있을 시 대응)
    const headers = ingredientsSheet.getRange(1, 1, 1, ingredientsSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf('is_bookmarked') === -1) {
      ingredientsSheet.getRange(1, headers.length + 1).setValue('is_bookmarked');
    }
  }
  
  if (!mealsSheet) {
    mealsSheet = ss.insertSheet('Meals');
    mealsSheet.appendRow(['uuid', 'type', 'date', 'time', 'ingredient_uuid', 'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber']);
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
  mealsSheet.appendRow([meal.uuid, meal.type, meal.date, meal.time, meal.ingredient_uuid, meal.amount, meal.kcal, meal.carbs, meal.protein, meal.fat, meal.sugar, meal.fiber]);
}

function saveIngredient(ing) {
  const { ingredientsSheet } = getSheets();
  ingredientsSheet.appendRow([ing.uuid, ing.name, ing.base_amount, ing.kcal, ing.carbs, ing.protein, ing.fat, ing.sugar, ing.fiber, ing.is_bookmarked || false]);
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
