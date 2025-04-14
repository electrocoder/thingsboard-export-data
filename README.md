# ThingsBoard Export Data
ThingsBoard Export Data is a tool to generate reports (PDF, PNG, XLS, JSON) from ThingsBoard dashboards using its open-source REST API.

## Features
- Connect to a ThingsBoard instance via REST API.
- Select devices and retrieve telemetry data for a specified time range.
- Export data as PDF, PNG, XLS, or JSON with clean filenames.
- Search telemetry data within the table, with highlighting and filtering.
- Responsive design with Bootstrap 5.
- Privacy Policy and Terms of Use pages.
- Licensed under GNU General Public License v3.0.
- Configurable date ranges and data limits.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/electrocoder/thingsboard-export-data.git
2. python -m http.server 8000
3. Open http://localhost:8000 in your browser.
4. Enter your ThingsBoard host, email, and password to log in.

## Dependencies
* Bootstrap 5.3.2
* jQuery 3.7.1
* Axios
* Flatpickr
* html2canvas
* jsPDF
* SheetJS (xlsx)

## License
This project is licensed under the GNU General Public License v3.0. See the LICENSE file for details.

## Usage
* Enter your ThingsBoard host, email, and password.
* Optionally save host and email to session storage (cleared when tab closes).
* Select a device and date range.
* Export telemetry data in your preferred format.

## Disclaimer
ThingsBoard Export Data is an independent project that utilizes ThingsBoard's open-source API. It is not affiliated with or endorsed by ThingsBoard, Inc.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue.
Feel free to share feedback with the ThingsBoard community on their GitHub or forums!

## Contact
For questions, reach out at https://github.com/electrocoder/thingsboard-export-data/issues

## Pages
Githup Pages https://electrocoder.github.io/thingsboard-export-data/

