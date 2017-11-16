const fs = require('fs');

const slcspCSV = './slcsp.csv';
const plansCSV = './plans.csv';
const zipsCSV = './zips.csv';

let zips;
let plansObj = {};

const convertToCsv = data => {
  const updatedSlcsp = data.map(row => row.join(',')).join('\n');
  fs.writeFile(slcspCSV, updatedSlcsp, err => {
    if (err) throw err;
    console.log('SLCSPs added to slcsp.csv file!');
  });
};

const sortByRate = (a, b) => a - b;

const getLocationCode = zip => {
  let targetIdx, targetRow, targetZip;
  let minIdx = 0;
  let maxIdx = zips.length - 1;
  zip = +zip;
  while (minIdx <= maxIdx) {
    targetIdx = Math.floor((minIdx + maxIdx) / 2);
    targetRow = zips[targetIdx];
    targetZip = targetRow[0];
    if (targetZip < zip) {
      minIdx = targetIdx + 1;
    } else if (targetZip > zip){
      maxIdx = targetIdx - 1;
    } else if ((targetIdx + 1 <= maxIdx && zips[targetIdx + 1][0] == zip) || (targetIdx - 1 >= minIdx && zips[targetIdx - 1][0] == zip)) {
      return false;
    } else {
      return targetRow[1] + '-' + targetRow[4];
    }
  }
};

const addSlcRateToRow = (slcspRow) => {
  const locationCode = getLocationCode(slcspRow[0]);
  if (locationCode && plansObj[locationCode]){
    slcspRow[1] = plansObj[locationCode].sort(sortByRate)[1];
  }
};

const addRatesPerZipToObj = plan => {
  const locationCode = plan[1] + '-' + plan[4];
  if (!plansObj[locationCode]) plansObj[locationCode] = [];
  plansObj[locationCode].push(plan[3]);
};

const removeDupliCodeZipCombos = (row, idx) => {
  if (idx === zips.length - 1) return true;
  const nextRow = zips[idx + 1];
  return row[0] !== nextRow[0] || row[1] !== nextRow[1] || row[4] !== nextRow[4];
};

const sortByZip = (a, b) => a[0] - b[0];

const getSlcspRatesByZips = (plans, slcsp, slcspFirstRow) => {
  zips.sort(sortByZip);
  zips = zips.filter(removeDupliCodeZipCombos);
  plans = plans.filter(plan => plan[2] === 'Silver');
  plans.forEach(addRatesPerZipToObj);
  slcsp.forEach(addSlcRateToRow);
  slcsp.unshift(slcspFirstRow);
  convertToCsv(slcsp);
};

const splitIntoRowsAndColumns = data => data.split('\n').map((row) => row.split(','));


fs.readFile(slcspCSV, 'utf8', (error, data) => {
  if (error) return console.error(error);
  let slcsp = splitIntoRowsAndColumns(data);
  let slcspFirstRow = slcsp.splice(0, 1);
  fs.readFile(plansCSV, 'utf8', (err, dta) => {
    if (err) return console.error(err);
    let plans = splitIntoRowsAndColumns(dta);
    plans.splice(0, 1);
    fs.readFile(zipsCSV, 'utf8', (e, dt) => {
      if (e) return console.error(e);
      zips = splitIntoRowsAndColumns(dt);
      zips.splice(0, 1);
      getSlcspRatesByZips(plans, slcsp, slcspFirstRow);
    });
  });
});
