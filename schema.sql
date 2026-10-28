-- ============================================================================
-- BLOOD BANK MANAGEMENT SYSTEM - DATABASE SCHEMA & SEED DATA
-- Relational Database Script (SQLite / ANSI SQL Compatible)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. USERS TABLE
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Admin' CHECK(role IN ('Admin', 'Staff', 'Technician'))
);

-- 2. DONORS TABLE
DROP TABLE IF EXISTS Donors;
CREATE TABLE Donors (
    donor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK(age >= 18 AND age <= 65),
    gender VARCHAR(10) NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
    blood_group VARCHAR(5) NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    last_donation_date DATE
);

-- 3. PATIENTS TABLE
DROP TABLE IF EXISTS Patients;
CREATE TABLE Patients (
    patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK(age >= 0 AND age <= 120),
    gender VARCHAR(10) NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
    blood_group VARCHAR(5) NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    hospital VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    required_units INTEGER NOT NULL CHECK(required_units > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Admitted' CHECK(status IN ('Admitted', 'Critical', 'Stable', 'Discharged'))
);

-- 4. BLOOD DONATIONS TABLE
DROP TABLE IF EXISTS Blood_Donations;
CREATE TABLE Blood_Donations (
    donation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id INTEGER NOT NULL,
    blood_group VARCHAR(5) NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    donation_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0), -- units (bags)
    collection_center VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Completed' CHECK(status IN ('Completed', 'Under Testing', 'Discarded')),
    FOREIGN KEY (donor_id) REFERENCES Donors(donor_id) ON DELETE CASCADE
);

-- 5. BLOOD INVENTORY TABLE
DROP TABLE IF EXISTS Blood_Inventory;
CREATE TABLE Blood_Inventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    blood_group VARCHAR(5) NOT NULL UNIQUE CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    available_units INTEGER NOT NULL DEFAULT 0 CHECK(available_units >= 0),
    last_updated DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('Available', 'Low Stock', 'Out of Stock'))
);

-- 6. BLOOD REQUESTS TABLE
DROP TABLE IF EXISTS Blood_Requests;
CREATE TABLE Blood_Requests (
    request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    blood_group VARCHAR(5) NOT NULL CHECK(blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    required_units INTEGER NOT NULL CHECK(required_units > 0),
    request_date DATE NOT NULL,
    priority VARCHAR(15) NOT NULL DEFAULT 'Normal' CHECK(priority IN ('Normal', 'High', 'Urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Fulfilled', 'Rejected')),
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON Donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_patients_blood_group ON Patients(blood_group);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON Blood_Donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_requests_patient ON Blood_Requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON Blood_Requests(status);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- 1. USERS
INSERT INTO Users (username, email, password, role) VALUES
('admin', 'admin@bloodbank.org', 'admin123', 'Admin'),
('dr_dube', 'aditya.dube@bloodbank.org', 'doctor2026', 'Admin'),
('nurse_sarah', 'sarah.jenkins@bloodbank.org', 'staff123', 'Staff'),
('tech_robert', 'robert.chen@bloodbank.org', 'tech123', 'Technician');

-- 2. DONORS
INSERT INTO Donors (name, age, gender, blood_group, phone, email, address, last_donation_date) VALUES
('Marcus Vance', 32, 'Male', 'O+', '+1 (555) 234-8901', 'marcus.vance@gmail.com', '742 Evergreen Terrace, Springfield', '2026-08-14'),
('Elena Rostova', 27, 'Female', 'A+', '+1 (555) 345-9012', 'elena.rostova@outlook.com', '128 Willow Creek Way, Austin, TX', '2026-07-22'),
('Devon Washington', 41, 'Male', 'B+', '+1 (555) 456-0123', 'devon.w@enterprise.net', '554 King Blvd, Atlanta, GA', '2026-09-02'),
('Sophia Lin', 24, 'Female', 'AB+', '+1 (555) 567-1234', 'sophia.lin@stanford.edu', '89 Campus Drive, Palo Alto, CA', '2026-06-19'),
('Liam Gallagher', 38, 'Male', 'O-', '+1 (555) 678-2345', 'liam.g@soundwav.org', '21 Baker Street, Boston, MA', '2026-09-10'),
('Amina Al-Mansoor', 29, 'Female', 'A-', '+1 (555) 789-3456', 'amina.mansoor@healthfirst.org', '432 Crescent Road, Chicago, IL', '2026-05-30'),
('Carlos Rodriguez', 45, 'Male', 'B-', '+1 (555) 890-4567', 'carlos.rod@soltech.com', '910 Sunset Blvd, Miami, FL', '2026-07-05'),
('Priya Sharma', 31, 'Female', 'AB-', '+1 (555) 901-5678', 'priya.sharma@medresearch.in', '304 Lotus Garden, Seattle, WA', '2026-08-28'),
('Jameson Burke', 35, 'Male', 'O+', '+1 (555) 112-6789', 'j.burke@metropolitan.org', '67 Harbor View, San Diego, CA', '2026-09-18'),
('Hannah Schmidt', 26, 'Female', 'A+', '+1 (555) 223-7890', 'hannah.schmidt@biofluid.de', '15 Alpine Lane, Denver, CO', '2026-08-01');

-- 3. PATIENTS
INSERT INTO Patients (name, age, gender, blood_group, hospital, phone, required_units, status) VALUES
('Arthur Pendelton', 58, 'Male', 'O+', 'St. Jude Memorial Hospital', '+1 (555) 987-6543', 3, 'Critical'),
('Miriam Abernathy', 64, 'Female', 'A+', 'City General Medical Center', '+1 (555) 876-5432', 2, 'Admitted'),
('Lucas Bennett', 19, 'Male', 'B+', 'University Trauma Center', '+1 (555) 765-4321', 4, 'Critical'),
('Chloe Dubois', 34, 'Female', 'AB+', 'Mercy Hospital & Health', '+1 (555) 654-3210', 1, 'Stable'),
('Vincent Zhao', 47, 'Male', 'O-', 'Metropolitan Emergency Ward', '+1 (555) 543-2109', 2, 'Critical'),
('Grace O''Connor', 72, 'Female', 'A-', 'Highland Regional Clinic', '+1 (555) 432-1098', 2, 'Admitted'),
('Tariq Siddiqui', 29, 'Male', 'B-', 'City General Medical Center', '+1 (555) 321-0987', 3, 'Admitted'),
('Zoe Katsaros', 22, 'Female', 'AB-', 'St. Jude Memorial Hospital', '+1 (555) 210-9876', 1, 'Stable'),
('Evelyn Reed', 51, 'Female', 'O+', 'Pinecrest Surgical Pavilion', '+1 (555) 109-8765', 2, 'Stable'),
('Derrick Evans', 40, 'Male', 'A+', 'University Trauma Center', '+1 (555) 098-7654', 3, 'Admitted');

-- 4. BLOOD INVENTORY (All 8 Blood Groups)
INSERT INTO Blood_Inventory (blood_group, available_units, last_updated, status) VALUES
('A+', 26, '2026-09-27 18:30:00', 'Available'),
('A-', 8, '2026-09-26 14:15:00', 'Low Stock'),
('B+', 19, '2026-09-27 16:45:00', 'Available'),
('B-', 5, '2026-09-25 11:20:00', 'Low Stock'),
('AB+', 14, '2026-09-27 12:00:00', 'Available'),
('AB-', 3, '2026-09-24 09:30:00', 'Low Stock'),
('O+', 34, '2026-09-27 17:10:00', 'Available'),
('O-', 4, '2026-09-26 19:00:00', 'Low Stock');

-- 5. BLOOD DONATIONS
INSERT INTO Blood_Donations (donor_id, blood_group, donation_date, quantity, collection_center, status) VALUES
(1, 'O+', '2026-08-14', 1, 'Central Red Cross Center', 'Completed'),
(2, 'A+', '2026-07-22', 1, 'City Memorial Blood Drive', 'Completed'),
(3, 'B+', '2026-09-02', 2, 'Metro Mobile Donation Bus #4', 'Completed'),
(4, 'AB+', '2026-06-19', 1, 'St. Jude Blood Donor Room', 'Completed'),
(5, 'O-', '2026-09-10', 1, 'Highland Community Center', 'Completed'),
(6, 'A-', '2026-05-30', 1, 'Central Red Cross Center', 'Completed'),
(7, 'B-', '2026-07-05', 1, 'City Memorial Blood Drive', 'Completed'),
(8, 'AB-', '2026-08-28', 1, 'University Campus Drive', 'Completed'),
(9, 'O+', '2026-09-18', 2, 'Central Red Cross Center', 'Completed'),
(10, 'A+', '2026-08-01', 1, 'Pinecrest Surgical Drive', 'Completed'),
(1, 'O+', '2026-09-25', 1, 'Central Red Cross Center', 'Under Testing'),
(3, 'B+', '2026-09-26', 1, 'Metro Mobile Donation Bus #4', 'Completed');

-- 6. BLOOD REQUESTS
INSERT INTO Blood_Requests (patient_id, blood_group, required_units, request_date, priority, status) VALUES
(1, 'O+', 3, '2026-09-27', 'Urgent', 'Pending'),
(2, 'A+', 2, '2026-09-26', 'Normal', 'Approved'),
(3, 'B+', 4, '2026-09-27', 'Urgent', 'Pending'),
(4, 'AB+', 1, '2026-09-25', 'Normal', 'Fulfilled'),
(5, 'O-', 2, '2026-09-27', 'Urgent', 'Pending'),
(6, 'A-', 2, '2026-09-24', 'High', 'Approved'),
(7, 'B-', 3, '2026-09-23', 'High', 'Fulfilled'),
(8, 'AB-', 1, '2026-09-22', 'Normal', 'Fulfilled'),
(9, 'O+', 2, '2026-09-26', 'Normal', 'Rejected'),
(10, 'A+', 3, '2026-09-27', 'High', 'Pending');
