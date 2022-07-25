

INSERT INTO users (username, first_name, last_name, birth_date, current_city, current_state, password, email, is_active )
        VALUES  ('test1', 'Eric', 'Davis', '1988-2-28', 'Irvine', 'CA', '$2b$12$cFtdK5S1FTm4p6WH08HgEeWW87VFwwp58IEQ2lkQIizRMTg9eAJX.', 'test1@test.com', true),
                ('test2', 'James', 'Franco', '1986-04-02', 'Los Angeles', 'CA',  '$2b$12$RyWcaNECRa.2s.SSXSaP5ucRsPhxnfA0R.VnxqClEYT9zWCRt4XYe', 'test2@test.com', true),
                ('test3', 'Troy', 'Aikman', '1977-06-03', 'Los Angeles', 'CA', '$2b$12$y/MiOghrohaRCbRAmGY8.OhO7tIKWZiy0dLy7LqXIR42w/X/4mqga', 'test3@test.com', true),
                ('test4', 'Erin', 'Jones', '1993-01-04', 'Costa Mesa', 'CA', '$2b$12$8vhJcxMeKfzCIG8714Wc.uLo8BN6R9tb3BVQaTmFbn4CeuxCCJJ82', 'test4@test.com', true),
                ('test5', 'Shirley', 'Temple', '1990-08-05', 'Orange', 'CA', '$2b$12$7riBtczefkjxD32uVI.w8.ZTSL0tKKIAQcNCfrOF7fXN1g/TzqcEm', 'test5@test.com', true);

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

INSERT INTO users_games(game_id, username)
        VALUES  (1, 'test4'),
                (1, 'test2'),
                (2, 'test1'),
                (2, 'test4'), 
                (3, 'test1'),
                (3, 'test2'),
                (3, 'test3'),
                (4, 'test3'),
                (5, 'test5'),
                (6, 'test1'),
                (7, 'test2'),
                (8, 'test4'),
                (9, 'test4'),
                (10, 'test5'),
                (11, 'test1'),
                (11, 'test2'),
                (11, 'test3'),
                (11, 'test4'),
                (11, 'test5');

INSERT INTO users_threads (id, username)
     VALUES ('1', 'test1'), 
            ('1', 'test2'),
            ('2', 'test1'),
            ('2', 'test2'),
            ('2', 'test3'),
            ('3', 'test1'),
            ('3', 'test2'),
            ('3', 'test3'),
            ('3', 'test4'),
            ('3', 'test5'), 
            ('4', 'test2'),
            ('4', 'test3'),
            ('5', 'test2'),
            ('5', 'test3'),
            ('5', 'test4');



INSERT INTO messages (party_id, message_from, message)
        VALUES ('1', 'test1', 'test message1'),
               ('1', 'test2', 'test message2'),
               ('2', 'test2', 'test message3'),
               ('2', 'test1', 'test message4'),
               ('2', 'test2', 'test message5'),
               ('3', 'test3', 'test message6'),
               ('3', 'test1', 'test message7'),
               ('3', 'test2', 'test message8'),
               ('3', 'test1', 'test message9'),
               ('3', 'test3', 'test message10'),
               ('3', 'test4', 'test message11'),
               ('4', 'test2', 'test message12'),           
               ('4', 'test3', 'test message13'),
               ('5', 'test3', 'test message14'),
               ('5', 'test4', 'test message15'),
               ('5', 'test2', 'test message16');

 INSERT INTO users_invites (game_id, from_user, to_user)
        VALUES (1, 'test1', 'test2'),
               (2, 'test1', 'test3'),
               (3, 'test1', 'test4'),
               (3, 'test1', 'test5'),
               (4, 'test5', 'test1'),
               (5, 'test4', 'test1'),
               (6, 'test3', 'test1'),
               (7, 'test2', 'test1'),
               (8, 'test1', 'test2'),
               (9, 'test1', 'test3'),
               (10, 'test1', 'test4'),
               (11, 'test1', 'test5');