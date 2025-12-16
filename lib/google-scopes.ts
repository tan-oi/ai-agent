export const GOOGLE_SCOPES = {
    gmail: [
    { read : "https://www.googleapis.com/auth/gmail.readonly"},
     { send : "https://www.googleapis.com/auth/gmail.send"},
    ],
    drive: [
      {drive : "https://www.googleapis.com/auth/drive"},
     {driveFile : "https://www.googleapis.com/auth/drive.file"},
    ],
    docs: [{all : "https://www.googleapis.com/auth/documents"}],
    sheets: [{all : "https://www.googleapis.com/auth/spreadsheets"}],
    calendar: [{all : "https://www.googleapis.com/auth/calendar"}],
    contacts: [ {read : "https://www.googleapis.com/auth/contacts.readonly"}],
  } as const;
  
