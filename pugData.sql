DELETE FROM users;
DELETE FROM games;


INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, profile_img, password, email, is_active )
        VALUES  ('test1', 'Eric', 'Davis', '1988-2-28', 'Irvine', 'CA', 'http://f1.img', '$2b$12$cFtdK5S1FTm4p6WH08HgEeWW87VFwwp58IEQ2lkQIizRMTg9eAJX.', 'test1@test.com', true),
                ('test2', 'James', 'Franco', '1986-04-02', 'Los Angeles', 'CA', 'http://f2.img', '$2b$12$RyWcaNECRa.2s.SSXSaP5ucRsPhxnfA0R.VnxqClEYT9zWCRt4XYe', 'test2@test.com', true),
                ('test3', 'Troy', 'Aikman', '1977-06-03', 'Los Angeles', 'CA', 'http://f3.img', '$2b$12$y/MiOghrohaRCbRAmGY8.OhO7tIKWZiy0dLy7LqXIR42w/X/4mqga', 'test3@test.com', true),
                ('test4', 'Erin', 'Jones', '1993-01-04', 'Costa Mesa', 'CA', 'http://f4.img', '$2b$12$8vhJcxMeKfzCIG8714Wc.uLo8BN6R9tb3BVQaTmFbn4CeuxCCJJ82', 'test4@test.com', true),
                ('test5', 'Shirley', 'Temple', '1990-08-05', 'Orange', 'CA', 'http://f5.img', '$2b$12$7riBtczefkjxD32uVI.w8.ZTSL0tKKIAQcNCfrOF7fXN1g/TzqcEm', 'test5@test.com', true);

INSERT INTO games(title, description, game_date, game_time, game_address, game_city, game_state, created_by, is_active )
        VALUES  ('g1', 'game1', (CURRENT_DATE + 2)::date, '12:00:00', 'ga1', 'Costa Mesa', 'CA', 'test1', true),
                ('g2', 'game2', (CURRENT_DATE + 3)::date, '12:00:02', 'ga2', 'Costa Mesa', 'CA', 'test2', true),
                ('g3', 'game3', (CURRENT_DATE - 2)::date, '12:00:03', 'ga3', 'Huntington Beach', 'CA', 'test3', true),
                ('g4', 'game4', (CURRENT_DATE + 2)::date, '12:00:04', 'ga4', 'Irvine', 'CA', 'test3', true),
                ('g5', 'game5', (CURRENT_DATE + 4)::date, '12:00:04', 'ga5', 'Irvine', 'CA', 'test5', true),
                ('g6', 'game6', (CURRENT_DATE + 4)::date, '12:00:04', 'ga6', 'Irvine', 'CA', 'test4', true),
                ('g7', 'game7', (CURRENT_DATE + 3)::date, '12:00:04', 'ga7', 'Los Angeles', 'CA', 'test2', true),
                ('g8', 'game8', (CURRENT_DATE + 2)::date, '12:00:04', 'ga8', 'Los Angeles', 'CA', 'test3', true),
                ('g9', 'game10', (CURRENT_DATE + 2)::date, '12:00:04', 'ga9', 'Orange', 'CA', 'test1', true),
                ('g10', 'game11', (CURRENT_DATE + 4)::date, '12:00:04', 'ga10', 'Anaheim', 'CA', 'test1', true),
                ('g11', 'game12', (CURRENT_DATE + 2)::date, '12:00:04', 'ga11', 'Mission Viejo', 'CA', 'test4', true);


        