/** Cascading country → state → town options for registration / profile. */
export interface LocationState {
  name: string;
  towns: string[];
}

export interface LocationCountry {
  name: string;
  code: string;
  states: LocationState[];
}

export const LOCATION_DATA: LocationCountry[] = [
  {
    name: 'India',
    code: 'IN',
    states: [
      {
        name: 'Madhya Pradesh',
        towns: ['Indore', 'Bhopal', 'Ujjain', 'Gwalior', 'Jabalpur'],
      },
      {
        name: 'Maharashtra',
        towns: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
      },
      {
        name: 'Karnataka',
        towns: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
      },
      {
        name: 'Telangana',
        towns: ['Hyderabad', 'Warangal', 'Nizamabad'],
      },
      {
        name: 'Delhi',
        towns: ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
      },
    ],
  },
  {
    name: 'United States',
    code: 'US',
    states: [
      {
        name: 'New York',
        towns: ['New York City', 'Buffalo', 'Rochester', 'Albany'],
      },
      {
        name: 'California',
        towns: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
      },
      {
        name: 'Texas',
        towns: ['Houston', 'Austin', 'Dallas', 'San Antonio'],
      },
    ],
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    states: [
      {
        name: 'England',
        towns: ['London', 'Manchester', 'Birmingham', 'Liverpool'],
      },
      {
        name: 'Scotland',
        towns: ['Edinburgh', 'Glasgow', 'Aberdeen'],
      },
    ],
  },
  {
    name: 'Canada',
    code: 'CA',
    states: [
      {
        name: 'Ontario',
        towns: ['Toronto', 'Ottawa', 'Mississauga'],
      },
      {
        name: 'British Columbia',
        towns: ['Vancouver', 'Victoria', 'Surrey'],
      },
    ],
  },
];
