/*
 * electrocoder
 */

function login(host, email, password) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      username: email,
      password: password
    });

    const end_point = host + "/api/auth/login";
    const xhr = new XMLHttpRequest();
    xhr.open('POST', end_point);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.token);
      } else {
        reject(new Error('Giriş başarısız: ' + xhr.status));
      }
    };

    xhr.onerror = function () {
      reject(new Error('İstek hatası'));
    };

    xhr.send(body);
  });
}

function get_user_id(host, token) {
  return new Promise((resolve, reject) => {
    const end_point = host + "/api/auth/user";
    const xhr = new XMLHttpRequest();
    xhr.open('GET', end_point);
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.customerId.id);
      } else {
        reject(new Error('Kullanıcı ID alınamadı: ' + xhr.status));
      }
    };

    xhr.onerror = function () {
      reject(new Error('İstek hatası'));
    };

    xhr.send();
  });
}

function get_devices(host, token, user_id) {
  return new Promise((resolve, reject) => {
    const end_point = host + "/api/customer/" + user_id + "/devices?pageSize=100&page=0";
    const xhr = new XMLHttpRequest();
    xhr.open('GET', end_point);
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.data);
      } else {
        reject(new Error('Cihazlar alınamadı: ' + xhr.status));
      }
    };

    xhr.onerror = function () {
      reject(new Error('İstek hatası'));
    };

    xhr.send();
  });
}

function get_keys(host, token, device_id) {
  return new Promise((resolve, reject) => {
    const end_point = host + "/api/plugins/telemetry/DEVICE/" + device_id + "/keys/timeseries";
    const xhr = new XMLHttpRequest();
    xhr.open('GET', end_point);
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        reject(new Error('Anahtarlar alınamadı: ' + xhr.status));
      }
    };

    xhr.onerror = function () {
      reject(new Error('İstek hatası'));
    };

    xhr.send();
  });
}

function get_telemetry(host, token, device_id, keys, startTs, endTs, limit) {
  return new Promise((resolve, reject) => {
    const keysStr = keys.join(",");
    const end_point = `${host}/api/plugins/telemetry/DEVICE/${device_id}/values/timeseries?keys=${keysStr}&startTs=${startTs}&endTs=${endTs}&limit=${limit}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', end_point);
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        window.lastTelemetryData = response; // JSON için sakla
        resolve(response);
      } else {
        reject(new Error('Telemetri alınamadı: ' + xhr.status));
      }
    };

    xhr.onerror = function () {
      reject(new Error('İstek hatası'));
    };

    xhr.send();
  });
}

function generateTable(telemetryData) {
  let table = '<table class="table table-striped">';
  table += '<thead><tr><th>Timestamp</th>';
  Object.keys(telemetryData).forEach(key => {
    table += `<th>${key}</th>`;
  });
  table += '</tr></thead>';

  const timestamps = new Set();
  Object.values(telemetryData).forEach(values => {
    values.forEach(item => timestamps.add(item.ts));
  });
  const sortedTimestamps = Array.from(timestamps).sort();

  table += '<tbody>';
  sortedTimestamps.forEach(ts => {
    table += `<tr><td>${new Date(ts).toLocaleString()}</td>`;
    Object.keys(telemetryData).forEach(key => {
      const valueObj = telemetryData[key].find(item => item.ts === ts);
      table += `<td>${valueObj ? valueObj.value : '-'}</td>`;
    });
    table += '</tr>';
  });
  table += '</tbody></table>';

  return table;
}

function formatDateForFilename(dateStr) {
  return dateStr.replace(/\s+/, '-').replace(/:/g, '-');
}

function formatDateForDisplay(dateStr) {
  return dateStr; // Zaten uygun formatta
}

function turkishToEnglish(str) {
  const turkishToEnglish = {
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C'
  };
  return str.replace(/[ğüşıöçĞÜŞİÖÇ]/g, match => turkishToEnglish[match]);
}

function getExportFilename(extension) {
  const deviceName = window.selectedDeviceName || 'Device';
  const startDate = window.selectedStartDate || 'Unknown';
  const endDate = window.selectedEndDate || 'Unknown';
  const cleanDeviceName = turkishToEnglish(deviceName).replace(/[^a-zA-Z0-9]/g, '-');
  const formattedStart = formatDateForFilename(startDate);
  const formattedEnd = formatDateForFilename(endDate);
  return `${cleanDeviceName}_${formattedStart}_to_${formattedEnd}.${extension}`;
}

function getExportInfo() {
  const startDate = window.selectedStartDate || 'Unknown';
  const endDate = window.selectedEndDate || 'Unknown';
  return {
    project: "TB Export Data",
    github: "https://github.com/your-username/tb-export-data",
    license: "Licensed under GNU General Public License v3.0",
    dateRange: `From ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`
  };
}

async function exportToPDF() {
  const table = document.getElementById('table-container');
  const info = getExportInfo();
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Başlık bilgileri
  pdf.setFontSize(16);
  pdf.text(info.project, 10, 10);
  pdf.setFontSize(12);
  pdf.text(`GitHub: ${info.github}`, 10, 20);
  pdf.text(info.license, 10, 30);
  pdf.text(info.dateRange, 10, 40);
  
  // Tablo için canvas
  const canvas = await html2canvas(table);
  const imgData = canvas.toDataURL('image/png');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(imgData, 'PNG', 10, 50, pdfWidth - 20, pdfHeight);
  pdf.save(getExportFilename('pdf'));
}

async function exportToPNG() {
  const tableContainer = document.getElementById('table-container');
  const info = getExportInfo();
  
  // Geçici bilgi div’i ekle
  const infoDiv = document.createElement('div');
  infoDiv.className = 'export-info';
  infoDiv.innerHTML = `
    <p>${info.project}</p>
    <p>GitHub: ${info.github}</p>
    <p>${info.license}</p>
    <p>${info.dateRange}</p>
  `;
  tableContainer.prepend(infoDiv);
  
  // Canvas ile yakala
  const canvas = await html2canvas(tableContainer);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = getExportFilename('png');
  link.click();
  
  // Div’i kaldır
  infoDiv.remove();
}

function exportToXLS() {
  const table = document.querySelector('#table-container table');
  const info = getExportInfo();
  
  // Bilgi satırı ekle
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.sheet_add_aoa(ws, [
    [info.project],
    [`GitHub: ${info.github}`],
    [info.license],
    [info.dateRange],
    [] // Boş satır
  ], { origin: 0 });
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Telemetry");
  XLSX.writeFile(wb, getExportFilename('xlsx'));
}

function exportToJSON() {
  const telemetryData = window.lastTelemetryData;
  const info = getExportInfo();
  
  const exportData = {
    info: info,
    telemetry: telemetryData
  };
  
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = getExportFilename('json');
  link.click();
}

function backToDevices() {
  document.getElementById('telemetry_id').style.display = 'none';
  document.getElementById('devices_id').style.display = 'block';
  document.getElementById('main_id').style.display = 'none';
}

function showMainPage() {
  document.getElementById('main_id').style.display = 'block';
  document.getElementById('devices_id').style.display = 'none';
  document.getElementById('telemetry_id').style.display = 'none';
}

function searchTable(query) {
  const table = document.querySelector('#table-container table');
  const tableContainer = document.getElementById('table-container');
  if (!table) return; // Tablo yoksa çık

  // Eski hata mesajını kaldır
  const existingAlert = tableContainer.querySelector('.alert');
  if (existingAlert) existingAlert.remove();

  const rows = table.querySelectorAll('tbody tr');
  query = query.toLowerCase().trim();
  let hasMatch = false;

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let rowMatch = false;
    let originalContent = [];

    // Orijinal içeriği sakla
    cells.forEach(cell => {
      originalContent.push(cell.innerHTML);
    });

    // Tüm sütunlarda ara (Timestamp dahil)
    cells.forEach((cell, index) => {
      const text = cell.textContent.toLowerCase();
      if (text.includes(query)) {
        rowMatch = true;
        // Eşleşen kelimeyi vurgula
        cell.innerHTML = cell.textContent.replace(
          new RegExp(query, 'gi'),
          match => `<mark>${match}</mark>`
        );
      } else {
        // Önceki vurguları kaldır
        cell.innerHTML = originalContent[index];
      }
    });

    if (rowMatch || query === '') {
      row.style.display = '';
      hasMatch = true;
    } else {
      row.style.display = 'none';
    }
  });

  // Hiç eşleşme yoksa hata mesajı göster
  if (!hasMatch && query !== '') {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      No results found for "${query}".
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    tableContainer.insertBefore(alertDiv, tableContainer.firstChild);
  }
}

// Sayfa yüklendiğinde sessionStorage’dan verileri doldur
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hostInput').value = sessionStorage.getItem('host') || '';
  document.getElementById('emailInput').value = sessionStorage.getItem('email') || '';
  document.getElementById('passwordInput').value = sessionStorage.getItem('password') || '';
});

async function main() {
  try {
    const host = document.getElementById("hostInput").value;
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    // sessionStorage’a kaydet
    if (document.getElementById('saveToSession').checked) {
      sessionStorage.setItem('host', host);
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('password', password);
    }

    const token = await login(host, email, password);
    console.log("Token:", token);

    const user_id = await get_user_id(host, token);
    console.log("User ID:", user_id);

    const devices = await get_devices(host, token, user_id);
    console.log("Devices:", devices);

    document.getElementById('main_id').style.display = 'none';
    document.getElementById('devices_id').style.display = 'block';
    document.getElementById('telemetry_id').style.display = 'none';

    // Cihazları listele
    const container = document.getElementById('device-list');
    container.innerHTML = '';
    window.devices = devices; // Cihazları global olarak sakla
    for (let i = 0; i < devices.length; i++) {
      const radiobox = document.createElement('input');
      radiobox.type = 'radio';
      radiobox.id = 'device' + i;
      radiobox.name = 'device';
      radiobox.value = devices[i].id.id;

      const label = document.createElement('label');
      label.htmlFor = 'device' + i;
      label.appendChild(document.createTextNode(devices[i].name + " / " + devices[i].id.id));

      const newline = document.createElement('br');
      container.appendChild(radiobox);
      container.appendChild(label);
      container.appendChild(newline);
    }

    // Flatpickr'ı başlat
    const now = new Date();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    flatpickr("#startDateTime", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      defaultDate: oneHourAgo,
      time_24hr: true
    });
    flatpickr("#endDateTime", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      defaultDate: now,
      time_24hr: true
    });

    // Arama çubuğunu başlat
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.getElementById('searchForm');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => searchTable(searchInput.value), 300);
    });
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      searchëtTable(searchInput.value);
    });

    // Get Telemetry butonu
    document.getElementById('select_device_button').addEventListener('click', async function (event) {
      event.preventDefault();
      const form = document.querySelector('.needs-validation');
      form.classList.add('was-validated');

      if (!form.checkValidity()) {
        return;
      }

      try {
        const device_id = document.querySelector('input[name="device"]:checked')?.value;
        if (!device_id) {
          alert("Lütfen bir cihaz seçin!");
          return;
        }

        // Cihaz adını bul
        const selectedDevice = window.devices.find(device => device.id.id === device_id);
        window.selectedDeviceName = selectedDevice ? selectedDevice.name : 'Unknown';

        const startDate = document.getElementById('startDateTime').value;
        const endDate = document.getElementById('endDateTime').value;
        const limit = document.getElementById('dataLimit').value;

        // Tarihleri sakla
        window.selectedStartDate = startDate;
        window.selectedEndDate = endDate;

        if (!startDate || !endDate) {
          alert("Lütfen başlangıç ve bitiş tarihlerini seçin!");
          return;
        }

        const startTs = new Date(startDate).getTime();
        const endTs = new Date(endDate).getTime();

        if (isNaN(startTs) || isNaN(endTs)) {
          alert("Geçersiz tarih formatı!");
          return;
        }

        if (startTs >= endTs) {
          alert("Bitiş tarihi başlangıç tarihinden sonra olmalı!");
          return;
        }

        if (!limit || limit < 1) {
          alert("Geçerli bir limit girin!");
          return;
        }

        const keys = await get_keys(host, token, device_id);
        if (!keys || keys.length === 0) {
          alert("Bu cihaz için veri anahtarı bulunamadı!");
          return;
        }

        const telemetryData = await get_telemetry(host, token, device_id, keys, startTs, endTs, limit);
        if (!telemetryData || Object.keys(telemetryData).length === 0) {
          alert("Seçilen aralıkta veri bulunamadı!");
          return;
        }

        const tableContainer = document.getElementById('table-container');
        tableContainer.innerHTML = generateTable(telemetryData);

        document.getElementById('main_id').style.display = 'none';
        document.getElementById('devices_id').style.display = 'none';
        document.getElementById('telemetry_id').style.display = 'block';

        // Arama çubuğunu sıfırla
        searchInput.value = '';
        searchTable('');
      } catch (error) {
        console.error("Telemetri alınırken hata:", error);
        alert("Veriler alınamadı: " + error.message);
      }
    });
  } catch (error) {
    console.error("Hata:", error);
    alert("Bir hata oluştu: " + error.message);
  }
}