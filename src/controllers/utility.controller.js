import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const ageCalculator = asyncHandler(async (req, res) => {
  const { birthDate } = req.body;
  
  if (!birthDate) throw new ApiError(400, "Birth date is required");
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (isNaN(birth.getTime())) throw new ApiError(400, "Invalid birth date format");
  if (birth > today) throw new ApiError(400, "Birth date cannot be in the future");
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
  const totalMonths = Math.floor(totalDays / 30.44);
  const totalWeeks = Math.floor(totalDays / 7);
  
  res.status(200).json({
    success: true,
    data: {
      birthDate: birth.toISOString().split('T')[0],
      currentDate: today.toISOString().split('T')[0],
      age: {
        years,
        months,
        days
      },
      total: {
        days: totalDays,
        months: totalMonths,
        weeks: totalWeeks
      },
      nextBirthday: {
        daysUntil: Math.ceil((new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate()) - today) / (1000 * 60 * 60 * 24)),
        monthsUntil: months < 0 ? 12 + months : months
      }
    }
  });
});

export const percentageCalculator = asyncHandler(async (req, res) => {
  const { value, total, percentage } = req.body;
  
  if (value === undefined || total === undefined) {
    throw new ApiError(400, "Value and total are required");
  }
  
  const numValue = parseFloat(value);
  const numTotal = parseFloat(total);
  
  if (isNaN(numValue) || isNaN(numTotal)) {
    throw new ApiError(400, "Value and total must be valid numbers");
  }
  
  if (numTotal === 0) throw new ApiError(400, "Total cannot be zero");
  
  const calculatedPercentage = (numValue / numTotal) * 100;
  const fraction = numValue / numTotal;
  
  res.status(200).json({
    success: true,
    data: {
      value: numValue,
      total: numTotal,
      percentage: calculatedPercentage,
      fraction: fraction,
      formatted: `${calculatedPercentage.toFixed(2)}%`,
      ofTotal: `${numValue} is ${calculatedPercentage.toFixed(2)}% of ${numTotal}`
    }
  });
});

export const averageCalculator = asyncHandler(async (req, res) => {
  const { numbers } = req.body;
  
  if (!numbers || !Array.isArray(numbers)) {
    throw new ApiError(400, "Numbers array is required");
  }
  
  if (numbers.length === 0) throw new ApiError(400, "Numbers array cannot be empty");
  
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  
  if (validNumbers.length === 0) {
    throw new ApiError(400, "All numbers must be valid");
  }
  
  const sum = validNumbers.reduce((acc, num) => acc + num, 0);
  const average = sum / validNumbers.length;
  const min = Math.min(...validNumbers);
  const max = Math.max(...validNumbers);
  const count = validNumbers.length;
  
  // Calculate median
  const sorted = [...validNumbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
  
  res.status(200).json({
    success: true,
    data: {
      numbers: validNumbers,
      count: count,
      sum: sum,
      average: average,
      median: median,
      min: min,
      max: max,
      range: max - min,
      formatted: `Average: ${average.toFixed(2)}, Median: ${median.toFixed(2)}, Range: ${(max - min).toFixed(2)}`
    }
  });
});

export const hoursCalculator = asyncHandler(async (req, res) => {
  const { startTime, endTime, breakTime = 0 } = req.body;
  
  if (!startTime || !endTime) {
    throw new ApiError(400, "Start time and end time are required");
  }
  
  const start = new Date(`2024-01-01T${startTime}`);
  const end = new Date(`2024-01-01T${endTime}`);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid time format. Use HH:MM format");
  }
  
  if (end <= start) {
    end.setDate(end.getDate() + 1); // Handle overnight shifts
  }
  
  const breakMinutes = parseInt(breakTime) || 0;
  if (breakMinutes < 0) throw new ApiError(400, "Break time cannot be negative");
  
  const totalMinutes = (end - start) / (1000 * 60) - breakMinutes;
  const hours = totalMinutes / 60;
  const roundedHours = Math.round(hours * 100) / 100;
  
  const hoursPart = Math.floor(hours);
  const minutesPart = Math.round((hours - hoursPart) * 60);
  
  res.status(200).json({
    success: true,
    data: {
      startTime: startTime,
      endTime: endTime,
      breakTime: breakMinutes,
      totalHours: roundedHours,
      totalMinutes: totalMinutes,
      formatted: `${hoursPart}h ${minutesPart}m`,
      decimal: `${roundedHours} hours`,
      overnight: end.getDate() !== start.getDate()
    }
  });
});

export const creditCardValidator = asyncHandler(async (req, res) => {
  const { cardNumber, cardType } = req.body;
  
  if (!cardNumber) throw new ApiError(400, "Card number is required");
  
  const cleanedNumber = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanedNumber)) {
    throw new ApiError(400, "Card number must contain only digits");
  }
  
  const cardTypes = {
    visa: /^4\d{12}(\d{3})?$/,
    mastercard: /^5[1-5]\d{14}$/,
    amex: /^3[47]\d{13}$/,
    discover: /^6(?:011|5\d{2})\d{12}$/,
    diners: /^3(?:0[0-5]|[68]\d)\d{11}$/,
    jcb: /^(?:2131|1800|35\d{3})\d{11}$/
  };
  
  function luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
  
  const isValidLuhn = luhnCheck(cleanedNumber);
  let detectedType = 'unknown';
  
  for (const [type, regex] of Object.entries(cardTypes)) {
    if (regex.test(cleanedNumber)) {
      detectedType = type;
      break;
    }
  }
  
  const isValidType = !cardType || cardType === detectedType;
  const isValid = isValidLuhn && isValidType;
  
  res.status(200).json({
    success: true,
    data: {
      cardNumber: cleanedNumber,
      isValid,
      isValidLuhn,
      isValidType,
      detectedType,
      requestedType: cardType || null,
      formatted: cleanedNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
    }
  });
});

export const fakeNameGenerator = asyncHandler(async (req, res) => {
  const { gender, country, includeSsn, includeDob } = req.body;
  
  const firstNames = {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Patrick', 'Frank', 'Raymond', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Amy', 'Angela', 'Ashley', 'Brenda', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Ella', 'Scarlett', 'Grace', 'Victoria', 'Madison', 'Chloe', 'Lily', 'Avery']
  };
  
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];
  
  const streets = ['Main St', 'Oak Ave', 'Elm Dr', 'Maple Ln', 'Pine Rd', 'Cedar Blvd', 'Washington Ave', 'Park Pl', 'First St', 'Second Ave', 'Third Dr', 'Fourth Ln', 'Fifth Rd', 'Sixth Blvd', 'Seventh Ave', 'Eighth Pl', 'Ninth St', 'Tenth Ave', 'Broadway', 'Church St', 'School Rd', 'College Ave', 'University Blvd', 'Park Ave', 'Center St', 'Market Pl', 'River Rd', 'Lake Dr', 'Hill Ln', 'Valley Ave'];
  
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore'];
  
  const states = ['NY', 'CA', 'TX', 'FL', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT'];
  
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com'];
  
  const selectedGender = gender && firstNames[gender] ? gender : (Math.random() < 0.5 ? 'male' : 'female');
  const firstName = firstNames[selectedGender][Math.floor(Math.random() * firstNames[selectedGender].length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const streetName = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  
  const phone = `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}@${domains[Math.floor(Math.random() * domains.length)]}`;
  
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const birthYear = Math.floor(Math.random() * 40) + 1980;
  const birthDate = `${birthMonth.toString().padStart(2, '0')}/${birthDay.toString().padStart(2, '0')}/${birthYear}`;
  
  const ssn = includeSsn ? `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}` : null;
  
  const result = {
    personal: {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender: selectedGender
    },
    contact: {
      email,
      phone,
      address: {
        street: `${streetNumber} ${streetName}`,
        city,
        state,
        zipCode: zipCode.toString(),
        fullAddress: `${streetNumber} ${streetName}, ${city}, ${state} ${zipCode}`
      }
    },
    birthDate: includeDob ? birthDate : null,
    ssn: ssn,
    username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`,
    password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
  };
  
  res.status(200).json({
    success: true,
    data: result
  });
});