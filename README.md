# BillSplit

BillSplit is a web application designed to help groups of friends manage and split expenses during trips. Users can store expenses, divide each friend's share, and settle up later, making it easier to keep track of who owes what.

## Features

- **User Accounts**: Create an account to manage your trips and expenses.
- **Trip Management**: Create new trips and add existing users to your trips, or be added to trips by friends.
- **Expense Splitting**: Split expenses among friends either equally or unequally within a trip.
- **Expense Tracking**: Track all expenses and debts within a trip, ensuring everyone knows how much they owe or are owed.

## Technologies Used

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Frontend**: React

## Database Structure

The database consists of tables for storing data related to users, trips, and transactions. 

## Debt Calculation

To calculate total debts, all transactions within a trip are fetched. Each amount is divided according to the share ratio, and all transactions are summed up to provide a clear picture of the debts.
