// CSV utility functions for employee data

export const downloadEmployeesCSV = (employees, venueName = null) => {
  // Define CSV headers - ID first for re-import matching
  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Location'];

  // Convert employees to CSV rows
  const rows = employees.map(employee => [
    employee.id || '',
    employee.first_name || '',
    employee.last_name || '',
    employee.email || '',
    employee.phone || '',
    employee.role || '',
    employee.location || ''
  ]);
  
  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const filename = venueName 
      ? `${venueName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_employees.csv`
      : 'employees.csv';
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseEmployeesCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        
        // Split by newline and filter out completely empty lines
        const lines = csv.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'));
          return;
        }
        
        // More robust CSV parsing function
        const parseCSVLine = (line) => {
          const fields = [];
          let currentField = '';
          let inQuotes = false;
          let i = 0;
          
          while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
              if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Handle escaped quotes ""
                currentField += '"';
                i += 2;
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
              }
            } else if (char === ',' && !inQuotes) {
              fields.push(currentField.trim());
              currentField = '';
              i++;
            } else {
              currentField += char;
              i++;
            }
          }
          
          // Don't forget the last field
          fields.push(currentField.trim());
          return fields.map(field => field.replace(/^"|"$/g, '').trim());
        };
        
        // Parse header
        const header = parseCSVLine(lines[0]);
        
        // Validate required headers
        const requiredHeaders = ['first name', 'last name', 'email'];
        const headerLower = header.map(h => h.toLowerCase());
        
        const missingHeaders = requiredHeaders.filter(req => {
          const reqLower = req.toLowerCase().replace(/\s+/g, '');
          return !headerLower.some(h => {
            const hLower = h.toLowerCase().replace(/\s+/g, '');
            return hLower.includes(reqLower) || hLower === req.toLowerCase();
          });
        });
        
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}. Found columns: ${header.join(', ')}`));
          return;
        }
        
        // Find column indices
        const getColumnIndex = (searchTerms) => {
          for (const term of searchTerms) {
            const index = headerLower.findIndex(h => {
              const hNormalized = h.toLowerCase().replace(/\s+/g, '');
              const termNormalized = term.toLowerCase().replace(/\s+/g, '');
              return hNormalized.includes(termNormalized) || hNormalized === term.toLowerCase();
            });
            if (index !== -1) return index;
          }
          return -1;
        };

        const idIndex = getColumnIndex(['id', 'employee_id', 'employee id']);
        const firstNameIndex = getColumnIndex(['first name', 'firstname', 'first_name', 'fname']);
        const lastNameIndex = getColumnIndex(['last name', 'lastname', 'last_name', 'lname']);
        const emailIndex = getColumnIndex(['email', 'email address', 'e-mail']);
        const phoneIndex = getColumnIndex(['phone', 'phone number', 'mobile', 'telephone']);
        const roleIndex = getColumnIndex(['role', 'position', 'job title', 'title']);
        const locationIndex = getColumnIndex(['location', 'area', 'department']);
        
        // Parse data rows
        const employees = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          try {
            const fields = parseCSVLine(line);
            
            // Extract employee data
            const id = idIndex >= 0 ? fields[idIndex]?.trim() : '';
            const firstName = fields[firstNameIndex]?.trim();
            const lastName = fields[lastNameIndex]?.trim();
            const email = fields[emailIndex]?.trim();
            const phone = phoneIndex >= 0 ? fields[phoneIndex]?.trim() : '';
            const role = roleIndex >= 0 ? fields[roleIndex]?.trim() : 'employee';
            const location = locationIndex >= 0 ? fields[locationIndex]?.trim() : '';

            // Validate required fields
            if (!firstName || !lastName || !email) {
              errors.push(`Row ${i + 1}: Missing required field (first name: "${firstName}", last name: "${lastName}", email: "${email}")`);
              continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push(`Row ${i + 1}: Invalid email format: "${email}"`);
              continue;
            }

            const employee = {
              first_name: firstName,
              last_name: lastName,
              email: email.toLowerCase(),
              phone: phone || null,
              role: role || 'employee',
              location: location || null
            };

            // Include ID if present (for update matching)
            if (id) {
              employee.id = id;
            }

            employees.push(employee);
            
          } catch (rowError) {
            errors.push(`Row ${i + 1}: Failed to parse row: ${rowError.message}`);
            continue;
          }
        }
        
        resolve({ employees, errors });
      } catch (error) {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};