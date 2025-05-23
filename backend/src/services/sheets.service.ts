import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const initializeSheets = () => {
  try {
    let credentials;
    
    if (process.env.GOOGLE_SHEETS_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS_JSON);
    } else if (process.env.GOOGLE_SHEETS_CREDENTIALS_PATH) {
      credentials = JSON.parse(
        fs.readFileSync(process.env.GOOGLE_SHEETS_CREDENTIALS_PATH, 'utf8')
      );
    } else {
      throw new Error('Google Sheets credentials not found');
    }

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, auth };
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    throw error;
  }
};

export const exportDataToSheets = async () => {
  try {
    const { sheets } = initializeSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID not found');
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthSheetSuffix = `${year}${month}`;

    const syncLog = await prisma.syncLog.create({
      data: {
        jobType: 'EXPORT_GSHEET',
        status: 'RUNNING',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      }
    });

    let rowsProcessed = 0;

    const users = await prisma.user.findMany({
      include: { department: true }
    });

    const usersData = [
      ['exported_timestamp', 'user_id', 'name', 'email', 'department_name', 'is_active'],
      ...users.map(user => [
        now.toISOString(),
        user.id,
        user.name,
        user.email,
        user.department?.name || '',
        user.isActive ? 'Yes' : 'No'
      ])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Users!A1',
      valueInputOption: 'RAW',
      requestBody: { values: usersData }
    });

    rowsProcessed += users.length;

    const balances = await prisma.user.findMany({
      where: { isActive: true },
      include: { department: true }
    });

    const balancesData = [
      ['exported_timestamp', 'user_id', 'user_name', 'department_name', 'balance_at_month_end'],
      ...balances.map(user => [
        now.toISOString(),
        user.id,
        user.name,
        user.department?.name || '',
        user.currentBalance
      ])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Balances_${monthSheetSuffix}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: balancesData }
    });

    rowsProcessed += balances.length;

    const startOfMonth = new Date(year, parseInt(month) - 1, 1);
    const endOfMonth = new Date(year, parseInt(month), 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        transactionTime: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        sender: true,
        recipient: true
      }
    });

    const transactionsData = [
      ['transaction_timestamp', 'sender_id', 'sender_name', 'recipient_id', 'recipient_name', 'amount', 'reason'],
      ...transactions.map(tx => [
        tx.transactionTime.toISOString(),
        tx.senderId,
        tx.sender.name,
        tx.recipientId,
        tx.recipient.name,
        tx.amount,
        tx.reason
      ])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Transactions_${monthSheetSuffix}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: transactionsData }
    });

    rowsProcessed += transactions.length;

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'SUCCESS',
        rowsProcessed,
        details: `Exported ${users.length} users, ${balances.length} balances, and ${transactions.length} transactions`
      }
    });

    return {
      success: true,
      message: 'Data exported successfully',
      details: `Exported ${users.length} users, ${balances.length} balances, and ${transactions.length} transactions`
    };
  } catch (error: any) {
    console.error('Error exporting data to sheets:', error);

    await prisma.syncLog.updateMany({
      where: { status: 'RUNNING', jobType: 'EXPORT_GSHEET' },
      data: {
        status: 'FAILED',
        details: `Export failed: ${error.message}`
      }
    });

    return {
      success: false,
      message: 'Export failed',
      error: error.message
    };
  }
};

export const importUsersFromSheets = async () => {
  try {
    const { sheets } = initializeSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID not found');
    }

    const syncLog = await prisma.syncLog.create({
      data: {
        jobType: 'IMPORT_USERS_GSHEET',
        status: 'RUNNING',
        sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      }
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'User_Import_Sheet!A:D'
    });

    const rows = response.data.values;
    
    if (!rows || rows.length <= 1) {
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          rowsProcessed: 0,
          details: 'No users to import'
        }
      });

      return {
        success: true,
        message: 'No users to import',
        imported: 0,
        updated: 0,
        deactivated: 0
      };
    }

    const userRows = rows.slice(1);
    let imported = 0;
    let updated = 0;
    let deactivated = 0;
    let errors = 0;

    for (const row of userRows) {
      try {
        const [name, email, departmentName, action] = row;
        
        if (!name || !email || !action) {
          console.warn('Skipping row with missing required fields:', row);
          continue;
        }

        let departmentId = null;
        if (departmentName) {
          const department = await prisma.department.findUnique({
            where: { name: departmentName }
          });
          
          if (department) {
            departmentId = department.id;
          } else {
            console.warn(`Department not found: ${departmentName}`);
          }
        }

        if (action.toUpperCase() === 'CREATE') {
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });

          if (existingUser) {
            console.warn(`User already exists: ${email}`);
            continue;
          }

          const tempPassword = Math.random().toString(36).slice(-8);
          const passwordHash = await import('bcrypt').then(bcrypt => 
            bcrypt.hash(tempPassword, 10)
          );

          await prisma.user.create({
            data: {
              name,
              email,
              passwordHash,
              departmentId,
              role: 'EMPLOYEE',
              isActive: true
            }
          });

          imported++;
        } else if (action.toUpperCase() === 'UPDATE') {
          const result = await prisma.user.updateMany({
            where: { email },
            data: {
              name,
              departmentId
            }
          });

          if (result.count > 0) {
            updated++;
          }
        } else if (action.toUpperCase() === 'DEACTIVATE') {
          const result = await prisma.user.updateMany({
            where: { email },
            data: {
              isActive: false
            }
          });

          if (result.count > 0) {
            deactivated++;
          }
        } else {
          console.warn(`Unknown action: ${action}`);
        }
      } catch (error) {
        console.error('Error processing user row:', row, error);
        errors++;
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: errors > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
        rowsProcessed: imported + updated + deactivated,
        rowsImported: imported + updated + deactivated,
        details: `Imported ${imported} users, updated ${updated} users, deactivated ${deactivated} users, errors: ${errors}`
      }
    });

    return {
      success: true,
      message: 'Users imported successfully',
      imported,
      updated,
      deactivated,
      errors
    };
  } catch (error: any) {
    console.error('Error importing users from sheets:', error);

    await prisma.syncLog.updateMany({
      where: { status: 'RUNNING', jobType: 'IMPORT_USERS_GSHEET' },
      data: {
        status: 'FAILED',
        details: `Import failed: ${error.message}`
      }
    });

    return {
      success: false,
      message: 'Import failed',
      error: error.message
    };
  }
};
