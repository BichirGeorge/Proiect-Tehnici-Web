DROP TYPE IF EXISTS firme_masini;
DROP TYPE IF EXISTS tipuri_masini;

CREATE TYPE firme_masini AS ENUM( 'audi', 'bmw', 'mercedes', 'jaguar', 'dacia', 'ferrari', 'lamborghini','rolls royce');
CREATE TYPE tipuri_masini AS ENUM('coupe', 'cabrio', 'berlina', 'break', 'hatchback', 'suv');


CREATE TABLE IF NOT EXISTS masini (
   id serial PRIMARY KEY,
   nume VARCHAR(50) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,
   putere_motor INT NOT NULL CHECK (putere_motor>=0),   
   firma firme_masini DEFAULT 'dacia',
   kilometraj INT NOT NULL CHECK (kilometraj>=0),
   tip tipuri_masini DEFAULT 'berlina',
   dotari VARCHAR [], --pot sa nu fie specificare deci nu punem NOT NULL
   masina_noua BOOLEAN NOT NULL DEFAULT FALSE,
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp
);

INSERT INTO masini (nume, descriere, pret, putere_motor, kilometraj, dotari, masina_noua, imagine)
VALUES 
    ('Mercedes-Benz E-Class', 'Mercedes-Benz E-Class, berlina de lux și eleganță', 40000.00, 250, 30000, '{"Asistență la conducere", "Scaune ventilate", "Faruri LED"}', TRUE, 'mercedes_e_class.jpg'),
    ('Jaguar F-Type', 'Jaguar F-Type, un coupe sportiv și rafinat', 65000.00, 380, 15000, '{"Suspensie ajustabilă", "Volan încălzit", "Sistem de sunet Meridian"}', TRUE, 'jaguar_f_type.jpg'),
    ('Ferrari 488 GTB', 'Ferrari 488 GTB, supercar de performanță extremă', 250000.00, 670, 5000, '{"Cupluri reglabile", "Sistem de control al tracțiunii", "Jante din aliaj ușor"}', TRUE, 'ferrari_488_gtb.jpg'),
    ('Lamborghini Urus', 'Lamborghini Urus, SUV de lux și viteză', 280000.00, 650, 10000, '{"Suspensie pneumatică", "Sistem de frânare ceramică", "Scaune din piele Nappa"}', TRUE, 'lamborghini_urus.jpg'),
    ('Rolls Royce Phantom', 'Rolls Royce Phantom, redefinirea luxului în automobilism', 500000.00, 563, 2000, '{"Plafon cu stele", "Uși de acces asistat", "Masaj pentru scaunele din spate"}', TRUE, 'rolls_royce_phantom.jpg'),
    ('Audi R8', 'Audi R8, Masini sportiva cu performanțe excelente', 45000.00, 220, 25000, '{"Volan multifuncțional", "Faruri Matrix LED", "Asistență la parcare"}', TRUE, 'audi_R8.jpg'),
    ('BMW 3 Series', 'BMW 3 Series, berlina emblematică cu caracter sportiv', 35000.00, 190, 35000, '{"Head-up Display", "Sistem de sunet Hi-Fi", "Scaune sportive"}', TRUE, 'bmw_3_series.jpg'),
    ('Dacia Sandero', 'Dacia Sandero, mașină compactă și accesibilă', 10000.00, 75, 60000, NULL, TRUE, 'dacia_sandero.jpg'),
    ('Mercedes-Benz GLE Coupe', 'Mercedes-Benz GLE Coupe, SUV coupe de lux și confort', 70000.00, 330, 18000, '{"Climatizare automată", "Suspensie pneumatică", "Sistem de navigație MBUX"}', TRUE, 'mercedes_gle_coupe.jpg'),
    ('Jaguar XJ', 'Jaguar XJ, berlina de lux cu design elegant', 60000.00, 340, 25000, '{"Plafon panoramic", "Scaune cu masaj", "Sistem audio Meridian"}', TRUE, 'jaguar_xj.jpg'),
    ('Ferrari Portofino', 'Ferrari Portofino, cabriolet de performanță și stil italian', 280000.00, 600, 8000, '{"Control electronic al suspensiei", "Scaune încălzite", "Sistem audio premium"}', TRUE, 'ferrari_portofino.jpg'),
    ('Lamborghini Aventador', 'Lamborghini Aventador, supercar excepțional de performanță', 400000.00, 730, 5000, '{"Scaune din fibră de carbon", "Sistem de navigație", "Suspensie reglabilă"}', TRUE, 'lamborghini_aventador.jpg'),
    ('Rolls Royce Cullinan', 'Rolls Royce Cullinan, SUV-ul de lux suprem', 600000.00, 563, 10000, '{"Panou de control tactil", "Plafon cu stele", "Scaune încălzite și ventilate"}', TRUE, 'rolls_royce_cullinan.jpg'),
    ('Audi TT', 'Audi TT, SUV de lux cu design elegant', 50000.00, 200, 30000, '{"Volan multifuncțional", "Scaune cu masaj", "Sistem audio Hi-Fi"}', TRUE, 'audi_tt.jpg'),
    ('BMW 5 Series', 'BMW 5 Series, SUV premium cu performanțe excelente', 45000.00, 220, 25000, '{"Volan multifuncțional", "Faruri Matrix LED", "Asistență la parcare"}', TRUE, 'bmw_5_series.jpg'),
    ('Dacia Duster', 'Dacia Duster, mašină compactă și accesibilă', 10000.00, 75, 60000, NULL, TRUE, 'dacia_duster.jpg'),
    ('BMW 7 Series', 'BMW 7 Series, SUV premium cu performanțe excelente', 45000.00, 220, 25000, '{"Volan multifuncțional", "Faruri Matrix LED", "Asistență la parcare"}', TRUE, 'bmw_7_series.jpg'),
    ('Audi A8', 'Audi A8, SUV premium cu performanțe excelente', 45000.00, 220, 25000, '{"Volan multifuncțional", "Faruri Matrix LED", "Asistență la parcare"}', TRUE, 'audi_a8.jpg'),
    ('Jaguar XE', 'Jaguar XE, SUV premium cu performanțe excelente', 45000.00, 220, 25000, '{"Volan multifuncțional", "Faruri Matrix LED", "Asistență la parcare"}', TRUE, 'jaguar_xe.jpg');