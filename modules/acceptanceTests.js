define(['monopoly', 'underscore', 'jasmine'], function (Monopoly, _) {
    describe("Acceptance Tests", function () {
        var horse, car, game, board;

        beforeEach(function () {
            horse = new Monopoly.Player("Horse");
            car = new Monopoly.Player("Car");
            bank = new Monopoly.Bank();
            board = new Monopoly.Board(bank);
            dice = new Monopoly.Dice();
            game = new Monopoly.Game([horse, car], board, dice);
        });

        describe("Player Movement", function () {
            it("Player on beginning location (numbered 0), rolls 7, ends up on location 7", function () {
                expect(board.currentLocation(horse)).toBe(board.GO);
                board.move(horse, 7);
                expect(board.currentLocation(horse).name).toBe('Chance');
            });

            it("Player on location numbered 39, rolls 6, ends up on location 5", function () {
                board.move(horse, 39);
                expect(board.currentLocation(horse)).toBe(board.BOARDWALK);
                board.move(horse, 6);
                expect(board.currentLocation(horse)).toBe(board.READING_RAILROAD);
            })
        });

        describe("Game Players", function () {
            it("Create a game with two players named Horse and Car", function () {
                expect(horse.name).toBe("Horse");
                expect(car.name).toBe("Car");
                expect(game.players.length).toBe(2);
            });

            describe("Try to create a game with < 2 or > 8 players. When attempting to play the game, it will fail", function () {
                it("Game fails with less than 2 players", function () {
                    expect(function () {
                        new Monopoly.Game([horse]);
                    }).toThrow('Need at least two players to play')
                });

                it("Game fails with greater than 8 players", function () {
                    expect(function () {
                        new Monopoly.Game([horse, car, horse, car, horse, car, horse, car, horse]);
                    }).toThrow('No more than 8 players may play')
                })
            });

            it("Create a game with two players named Horse and Car. Within creating 100 games, both orders [Horse, Car] and [car, horse] occur", function () {
                var horseFirst = false;
                var carFirst = false;
                for (var i = 0; i < 100; i++) {
                    game = new Monopoly.Game([horse, car], board);
                    if (game.players[0] === horse) horseFirst = true;
                    if (game.players[0] === car) carFirst = true;
                    if (horseFirst && carFirst) break;
                }
                expect(horseFirst).toBe(true);
                expect(carFirst).toBe(true)
            })
        });

        describe("Game Rounds", function () {
            it("Create a game and play, verify that the total rounds was 20 and that each player played 20 rounds", function () {
                var rounds = game.play();
                var horseTurns = 0;
                var carTurns = 0;
                _.each(rounds, function (round) {
                    _.each(round.turns, function (turn) {
                        if (turn.player === horse) horseTurns++;
                        if (turn.player === car) carTurns++;
                    });
                });
                expect(rounds.length).toBe(20);
                expect(horseTurns).toBe(20);
                expect(carTurns).toBe(20)
            });

            it("Create a game and play, verify that in every round the order of the players remained the same", function () {
                var rounds = game.play();
                _.each(rounds, function (round) {
                    expect(round.turns[0].player).toBe(game.players[0]);
                    expect(round.turns[1].player).toBe(game.players[1]);
                });
            });
        });

        describe('Landing on Go', function () {
            it('During a turn a Player lands on Go and their balance increases by $200', function () {
                var balance = horse.balance;
                board.move(horse, 40);
                expect(horse.balance).toBe(balance + 200);
            });

            it('During a turn a Player lands on some "normal" location and their balance does not change', function () {
                var balance = horse.balance;
                board.move(horse, 1);
                expect(horse.balance).toBe(balance - board.MEDITERRANEAN_AVENUE.landedOnStrategy.price);
            });
        });

        describe('Passing over Go', function () {
            it("Player starts before Go near the end of the Board, rolls enough to pass Go. The Player's balance increases by $200", function () {
                board.move(horse, 39);
                var balance = horse.balance;
                board.move(horse, 2);
                expect(horse.balance).toBe(balance + 200 - board.MEDITERRANEAN_AVENUE.landedOnStrategy.price);
            });

            it('Player starts on Go, takes a turn where the Player does not additionally land on or pass over Go. Their balance remains unchanged', function () {
                var balance = horse.balance;
                board.move(horse, 39);
                expect(horse.balance).toBe(balance - board.BOARDWALK.landedOnStrategy.price);
            });

            it('Player passes go twice during a turn. Their balance increases by $200 each time for a total change of $400', function () {
                var balance = horse.balance;
                board.move(horse, 41);
                expect(horse.balance).toBe(balance + 200 - board.MEDITERRANEAN_AVENUE.landedOnStrategy.price);
                balance = horse.balance;
                board.move(horse, 40);
                expect(horse.balance).toBe(balance + 200);
            });
        });

        describe('Landing on Go To Jail', function () {
            it('Player starts before Go To Jail, lands on Go To Jail, ends up on Just Visiting and their balance is unchanged', function () {                
                board.moveTo(horse, board.WATER_WORKS);
                var balance = horse.balance;
                board.move(horse, 2);
                expect(board.currentLocation(horse)).toBe(board.JAIL);
                expect(horse.balance).toBe(balance);
            });

            it('Player starts before Go To Jail, rolls enough to pass over Go To Jail but not enough to land on or pass over go. Their balance is unchanged and they end up where the should based on what they rolled', function () {
                board.moveTo(horse, board.WATER_WORKS);
                board.move(horse, 3);
                expect(board.currentLocation(horse)).toBe(board.PACIFIC_AVENUE);
            });
        });

        describe('As a Player, landing on Income Tax forces me to pay the smaller of 10% of my total worth or $200', function () {
            it('During a turn, a Player with an initial total worth of $1800 lands on Income Tax. The balance decreases by $180', function () {
                horse.pay(300);
                var balance = horse.balance;
                board.moveTo(horse, board.INCOME_TAX);
                expect(horse.balance).toBe(balance * 0.9);
            });

            it('During a turn, a Player with an initial total worth of $2200 lands on Income Tax. The balance decreases by $200', function () {
                horse.pay(700);
                var balance = horse.balance;
                board.moveTo(horse, board.INCOME_TAX);
                expect(horse.balance).toBe(balance - 200);
            });

            it('During a turn, a Player with an initial total worth of $0 lands on Income Tax. The balance decreases by $0', function () {
                horse.charge(1500);
                board.moveTo(horse, board.INCOME_TAX);
                expect(horse.balance).toBe(0);
            });

            it('During a turn, a Player with an initial total worth of $2000 lands on Income Tax. The balance decreases by $200', function () {
                horse.pay(500);
                var balance = horse.balance;
                board.moveTo(horse, board.INCOME_TAX);
                expect(horse.balance).toBe(balance - 200);
            });

            it('During a turn, a Player passes over Income Tax. Nothing happens', function () {
                var balance = horse.balance;
                board.moveTo(horse, board.JAIL);
                expect(horse.balance).toBe(balance);
            });
        });

        describe('As a Player, when I land on Luxury Tax, I pay $75', function () {
            it('Player takes a turn and lands on Luxury tax. Their balance decreases by $75', function () {
                var balance = horse.balance;
                board.moveTo(horse, board.LUXURY_TAX);
                expect(horse.balance).toBe(balance - 75);
            });

            it('Player passes Luxury Tax during a turn. Their balance is unchanged', function () {
                var balance = horse.balance;
                board.moveTo(horse, board.BOARDWALK);
                expect(horse.balance).toBe(balance - board.BOARDWALK.landedOnStrategy.price);
            });
        });

        describe('As a player, I can buy an unowned property when I land on it during a turn.', function () {
            it('Land on a Property that is not owned. After turn, property is owned and balance decreases by cost of property', function () {
                var balance = horse.balance;
                board.moveTo(horse, board.PACIFIC_AVENUE);
                expect(board.PACIFIC_AVENUE.owner).toBe(horse);
                expect(horse.balance).toBe(balance - board.PACIFIC_AVENUE.landedOnStrategy.price);
            });

            it('Land on a Property that I own, nothing happens', function () {
                var balance = horse.balance;
                board.PACIFIC_AVENUE.owner = horse;
                board.moveTo(horse, board.PACIFIC_AVENUE);
                expect(board.PACIFIC_AVENUE.owner).toBe(horse);
                expect(horse.balance).toBe(balance);
            });

            it('Pass over an unowned Property, nothing happens', function () {
                board.moveTo(horse, board.BOARDWALK);
                expect(board.PACIFIC_AVENUE.owner).toBeNull();
            });
        });
    });
});
