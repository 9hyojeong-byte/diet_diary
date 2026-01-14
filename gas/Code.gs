
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
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'saveIngredient') {
    saveIngredient(data);
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ingredientsSheet = ss.getSheetByName('Ingredients');
  let mealsSheet = ss.getSheetByName('Meals');
  
  if (!ingredientsSheet) {
    ingredientsSheet = ss.insertSheet('Ingredients');
    ingredientsSheet.appendRow(['uuid', 'name', 'base_amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber']);
  }
  
  if (!mealsSheet) {
    mealsSheet = ss.insertSheet('Meals');
    mealsSheet.appendRow(['uuid', 'type', 'date', 'time', 'ingredient_uuid', 'amount', 'kcal', 'carbs', 'protein', 'fat', 'sugar', 'fiber']);
  }
  
  return { ingredientsSheet, mealsSheet };
}

function getAllData() {
  const { ingredientsSheet, mealsSheet } = getSheets();
  
  // getDisplayValues()는 시트에 보이는 '텍스트' 그대로를 가져옵니다. (1899년 날짜 변환 방지)
  const ingData = ingredientsSheet.getDataRange().getDisplayValues();
  const mealData = mealsSheet.getDataRange().getDisplayValues();
  
  const ingredients = dataToJson(ingData);
  const meals = dataToJson(mealData);
  
  return { ingredients, meals };
}

/**
 * 시트 데이터를 JSON 객체 배열로 변환합니다.
 * 모든 값을 문자열로 처리하되, 앞뒤 공백을 제거합니다.
 */
function dataToJson(data) {
  if (data.length <= 1) return [];
  
  // 헤더 정리: 공백 제거 및 소문자화
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      
      // getDisplayValues()로 가져온 값은 이미 텍스트이므로 trim()만 수행
      obj[header] = (val !== null && val !== undefined) ? String(val).trim() : "";
    });
    return obj;
  });
}

function saveMeal(meal) {
  const { mealsSheet } = getSheets();
  mealsSheet.appendRow([
    meal.uuid,
    meal.type,
    meal.date,
    meal.time,
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
  ingredientsSheet.appendRow([
    ing.uuid,
    ing.name,
    ing.base_amount,
    ing.kcal,
    ing.carbs,
    ing.protein,
    ing.fat,
    ing.sugar,
    ing.fiber
  ]);
}
