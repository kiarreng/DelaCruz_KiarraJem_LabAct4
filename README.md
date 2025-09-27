# 3ISB - Laboratory Activity 4: Extending Authentication API with SQL JOIN Reports

# 📌 **Overview**  
This activity will build on the folder from LabAct3 (Authentication API) by extending the database and implementing JOIN-based reports. All newly created endpoints must be secured with JWT authentication.

_(Note: Make sure to download XAMPP, Visual Studio Code, and Postman as these will be needed for this project)_

# 🚀 **Run Project**  
  
# **Step 1: Download Repository Files** 
- This repository already contains all the necessary files for the activity 

# **Step 2: Extend Database**
- Note: Ensure that the users table already contains sample data
- Create these tables in the same database used by Lab 3 (e.g., lab_auth)
     
      -- Profiles: optional 1:1 with users (some users may have none)
      CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        phone VARCHAR(30),
        city VARCHAR(80),
        country VARCHAR(80),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  
      -- Roles + user_roles: many-to-many between users and roles
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(40) UNIQUE NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
       
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, role_id),
        CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      -- Login audit: many sign-ins per user
      CREATE TABLE IF NOT EXISTS login_audit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(45),
        success TINYINT(1) DEFAULT 1,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_la_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      
      -- Self-join example: referrals among users
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_user_id INT NOT NULL,
        referred_user_id INT NOT NULL,
        referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_ref_referrer FOREIGN KEY (referrer_user_id) REFERENCES users(id),
        CONSTRAINT fk_ref_referred FOREIGN KEY (referred_user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
- Seed Data (adjust user IDs to your data):

  Ensure some users have no profile or no roles so LEFT/RIGHT/FULL joins produce meaningful NULLs.

      INSERT INTO roles (role_name) VALUES ('student'), ('instructor'), ('admin')
      ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);
      
      INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
        (1, 1), (1, 3), (2, 1), (3, 2), (4, 1);
      
      INSERT INTO profiles (user_id, phone, city, country) VALUES
        (1, '09171234567', 'Manila', 'PH'),
        (3, '09981234567', 'Quezon City', 'PH');
      
      INSERT INTO login_audit (user_id, ip_address, success) VALUES
        (1, '192.168.1.10', 1),
        (1, '192.168.1.11', 1),
        (2, '10.0.0.3', 0),
        (3, '172.16.5.5', 1);
      
      INSERT INTO referrals (referrer_user_id, referred_user_id) VALUES
        (1, 2), (1, 3), (3, 4);

# **Step 3: Join Queries**
Open phpMyAdmin and run the required JOIN queries on the database.
1. The *Inner Join* connects tables, users → user_roles → roles, so it only returns users (u.id, u.email) who have matching entries in user_roles and roles (r.role_name).

        SELECT u.id, u.email, r.role_name
        FROM users u
        INNER JOIN user_roles ur ON ur.user_id = u.id
        INNER JOIN roles r ON r.id = ur.role_id
        ORDER BY u.id, r.role_name;

2. The *Left Join* returns all users (u.id, u.email) from users along with their profile details (p.phone, p.city, p.country) if they exist in profiles, otherwise showing NULL for missing profile data.

        SELECT u.id, u.email, p.phone, p.city, p.country
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        ORDER BY u.id;
   
3. The *Right Join* ensures all roles (r.role_name) from roles are included, showing linked users (u.id, u.email) if they exist in users through user_roles, or NULL if no matching user is found.

        SELECT r.role_name, u.id AS user_id, u.email
        FROM users u
        RIGHT JOIN user_roles ur ON ur.user_id = u.id
        RIGHT JOIN roles r ON r.id = ur.role_id
        ORDER BY r.role_name, user_id;

4. The *Full Outer Join* is emulated by combining a left join and a right join with union, so it returns all users (u.id, u.email) and all profiles (p.id), including those without matches on either side.

        SELECT u.id AS user_id, u.email, p.id AS profile_id
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        UNION
        SELECT u.id AS user_id, u.email, p.id AS profile_id
        FROM users u
        RIGHT JOIN profiles p ON p.user_id = u.id
        ORDER BY user_id; 

5. The *Cross Join* pairs every user (u.id, u.email) from users with every role (r.role_name) from roles, producing all possible user–role combinations.

        SELECT u.id AS user_id, u.email, r.role_name
        FROM users u 
        CROSS JOIN roles r 
        ORDER BY u.id, r.role_name;

6. The *Self Join* makes the users table join to itself (user1 as referrer and user2 as referred) through the referrals table, so it can show who referred, along with their emails and referral date.

        SELECT ref.referrer_user_id, u1.email AS referrer_email,
                  ref.referred_user_id, u2.email AS referred_email, ref.referred_at
        FROM referrals ref
        INNER JOIN users u1 ON u1.id = ref.referrer_user_id
        INNER JOIN users u2 ON u2.id = ref.referred_user_id
        ORDER BY ref.referred_at DESC;

7. The *Left Join* with a Subquery returns every user (u.id, u.email) along with only their most recent login record (la.ip_address, la.occurred_at) by matching login_audit rows to the MAX(occurred_at) per user.

        SELECT u.id, u.email, la.ip_address, la.occurred_at
        FROM users u
        LEFT JOIN login_audit la 
        ON la.user_id = u.id
        AND la.occurred_at = (
        SELECT MAX(la2.occurred_at)
        FROM login_audit la2
        WHERE la2.user_id = u.id
        ) ORDER BY u.id;

# **Step 4: Testing with Postman**  
Perform /api/reports/... endpoint, set Authorization → Bearer Token = {{token}}. _Note: You must first log in to obtain a valid JWT token before accessing these endpoints_
- GET /api/reports/users-with-roles → Shows users with their assigned roles (Inner Join).
- GET /api/reports/users-with-profiles → Lists users with profile details if available (Left Join).
- GET /api/reports/roles-right-join → Displays all roles and their associated users (Right Join).
- GET /api/reports/profiles-full-outer → Combines users and profiles, showing matches and non-matches (Full Outer Join).
- GET /api/reports/user-role-combos → Generates all possible user–role combinations (Cross Join).
- GET /api/reports/referrals → Lists who referred whom with timestamps (Self Join).
- GET /api/reports/latest-login → Shows the most recent login per user. (Left Join with a Subquery)

_Note: Use Postman environment with {{baseUrl}}._
