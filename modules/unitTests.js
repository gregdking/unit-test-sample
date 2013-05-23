define(['monopoly', 'underscore', 'jasmine'], function (Monopoly, _) {
    describe('Unit Tests', function () {
        var horse, car, players, game, bank, board, dice;

        beforeEach(function () {
            horse = new Monopoly.Player('Horse');
            car = new Monopoly.Player('Car');
            players = [horse, car];
            bank = new Monopoly.Bank();
            board = new Monopoly.Board(bank);
            dice = new Monopoly.Dice();
            game = new Monopoly.Game([horse, car], board, dice);
        });

        describe('Monopoly.Game', function () {
            describe('constructor', function () {
                it('accepts an array of players', function () {
                    expect($.isArray(game.players)).toBe(true);
                    expect(game.players.length).toBe(2)
                });

                it('accepts a board', function () {
                    expect(game.board).toBe(board);
                });

                it('accepts dice', function () {
                    expect(game.dice).toBe(dice);
                });

                it('throws an exception if less than 2 players are passed in', function () {
                    expect(function () {
                        new Monopoly.Game([horse]);
                    }).toThrow('Need at least two players to play')
                });

                it('throws an exception if more than 8 players are passed in', function () {
                    expect(function () {
                        new Monopoly.Game([horse, car, horse, car, horse, car, horse, car, horse]);
                    }).toThrow('No more than 8 players may play')
                });

                it('randomizes the order of players', function () {
                    var horseFirst = false;
                    var carFirst = false;
                    for (var i = 0; i < 100; i++) {
                        var game = new Monopoly.Game([horse, car], board);
                        if (game.players[0] === horse) horseFirst = true;
                        if (game.players[0] === car) carFirst = true;
                        if (horseFirst && carFirst) break;
                    }
                    expect(horseFirst).toBe(true);
                    expect(carFirst).toBe(true)
                })

                it('sets up the players on the board', function () {
                    expect(board.players).toBe(game.players);
                    expect($.isArray(board.playerLocations)).toBe(true);
                    expect(board.playerLocations.length).toBe(2);
                    _.each(board.playerLocations, function (location) {
                        expect(location).toBe(board.GO);
                    });
                });
            });

            describe('play', function () {
                it('returns the 20 Rounds played', function () {
                    var rounds = game.play();
                    expect(rounds.length).toBe(20);
                });

                it('returns rounds with a turn for each player', function () {
                    var rounds = game.play();
                    _.each(rounds, function (round) {
                        expect(round.turns.length).toBe(2);
                        expect(round.turns[0].player).toBe(game.players[0]);
                        expect(round.turns[1].player).toBe(game.players[1]);
                    })
                });

                it('returns rounds with the given board', function () {
                    var rounds = game.play();
                    _.each(rounds, function (round) {
                        expect(round.board).toBe(board);
                    })
                });

                it('returns rounds with the given dice', function () {
                    var rounds = game.play();
                    _.each(rounds, function (round) {
                        expect(round.dice).toBe(dice);
                    })
                });
            });
        });

        describe('Monopoly.Dice', function () {
            describe('constructor', function () {
                it('defaults both dice to null', function () {
                    var dice = new Monopoly.Dice();
                    expect(dice.die1).toBeNull();
                    expect(dice.die2).toBeNull();
                });
            });

            describe('roll', function () {
                it('each roll is between 1 and 6 inclusive', function () {
                    var dice = new Monopoly.Dice();
                    for (var i = 0; i < 100; i++) {
                        dice.roll();
                        expect(dice.die1).toBeGreaterThan(0);
                        expect(dice.die1).toBeLessThan(7);
                        expect(dice.die2).toBeGreaterThan(0);
                        expect(dice.die2).toBeLessThan(7);
                    }
                })
            });
            
            describe('value', function () {
                it('returns the sum of the two dice', function () {
                    var dice = new Monopoly.Dice();
                    for (var i = 0; i < 100; i++) {
                        dice.roll();
                        expect(dice.value()).toBe(dice.die1 + dice.die2);
                    }
                });
            });

            describe('isDoubles', function () {
                it('returns true if dice are equal', function () {
                    var dice = new Monopoly.Dice();
                    dice.die1 = 2;
                    dice.die2 = 2;
                    expect(dice.isDoubles()).toBe(true);
                });

                it('returns false if dice are not equal', function () {
                    var dice = new Monopoly.Dice();
                    dice.die1 = 2;
                    dice.die2 = 3;
                    expect(dice.isDoubles()).toBe(false);
                });
            });
        });

        describe('Monopoly.Player', function () {
            describe('constructor', function () {
                it('accepts a player name', function () {
                    expect(horse.name).toBe('Horse');
                });

                it('defaults balance to zero', function () {
                    horse = new Monopoly.Player('Horse');
                    expect(horse.balance).toBe(0);
                });

                it('defaults locations to empty', function () {
                    horse = new Monopoly.Player('Horse');
                    expect(horse.locations.length).toBe(0);
                });
            });

            describe('pay', function () {
                it('increases player balance by the given amount', function () {
                    var balance = horse.balance;
                    horse.pay(50);
                    expect(horse.balance).toBe(balance + 50);
                });
            });

            describe('charge', function () {
                it('decreases player balance by the given amount', function () {
                    var balance = horse.balance;
                    horse.charge(20);
                    expect(horse.balance).toBe(balance - 20);
                });
            });

            describe('buy', function () {
                it('adds location to player\'s locations', function () {
                    horse.buy(board.PACIFIC_AVENUE, 100);
                    expect(horse.locations).toContain(board.PACIFIC_AVENUE);
                });

                it('updates the location\'s owner', function () {
                    horse.buy(board.PACIFIC_AVENUE, 100);
                    expect(board.PACIFIC_AVENUE.owner).toBe(horse);
                });

                it('deducts the price from the player\'s balance', function () {
                    var balance = horse.balance;
                    horse.buy(board.PACIFIC_AVENUE, 100);
                    expect(horse.balance).toBe(balance - 100);
                });
            });

            describe('owns', function () {
                it('returns false if the location has no owner', function () {
                    expect(horse.owns(board.PACIFIC_AVENUE)).toBe(false);
                });

                it('returns false if a different player owns the location', function () {
                    car.buy(board.PACIFIC_AVENUE, 100);
                    expect(horse.owns(board.PACIFIC_AVENUE)).toBe(false);
                });

                it('returns true if the player owns the location', function () {
                    horse.buy(board.PACIFIC_AVENUE, 100);
                    expect(horse.owns(board.PACIFIC_AVENUE)).toBe(true);
                });
            });

            describe('railroads', function () {
                it('returns 0 zero if no railroads owned', function () {
                    expect(horse.railroads()).toBe(0);
                });
            });
        });

        describe('Monopoly.Round', function () {
            var round;

            beforeEach(function () {
                round = new Monopoly.Round(players, board, dice);
            });

            describe('constructor', function () {
                it('accepts an array of players', function () {
                    expect(round.players).toBe(players);
                });

                it('creates an empty array of turns', function () {
                    expect(round.turns.length).toBe(0);
                });

                it('accepts a board', function () {
                    expect(round.board).toBe(board);
                });

                it('accepts dice', function () {
                    expect(round.dice).toBe(dice);
                });
            });

            describe('play', function () {
                it('creates a turn for each player', function () {
                    round.play();
                    expect(round.turns.length).toBe(2);
                    expect(round.turns[0].player).toBe(players[0]);
                    expect(round.turns[1].player).toBe(players[1]);
                });

                it('creates a turn with the correct board', function () {
                    round.play();
                    expect(round.turns[0].board).toBe(board);
                    expect(round.turns[1].board).toBe(board);
                });

                it('creates a turn with the correct dice', function () {
                    round.play();
                    expect(round.turns[0].dice).toBe(dice);
                    expect(round.turns[1].dice).toBe(dice);
                });
            });
        });

        describe('Monopoly.Turn', function () {
            var turn;

            beforeEach(function () {
                turn = new Monopoly.Turn(horse, board, dice);
            });

            describe('constructor', function () {
                it('accepts a player', function () {
                    expect(turn.player).toBe(horse);
                });

                it('accepts a board', function () {
                    expect(turn.board).toBe(board);
                });

                it('accepts dice', function () {
                    expect(turn.dice).toBe(dice);
                });
            });

            describe('play', function () {
                it('rolls the dice', function () {
                    spyOn(dice, 'roll');
                    turn.play();
                    expect(dice.roll).toHaveBeenCalled();
                });

                it('moves the player', function () {
                    spyOn(board, 'move');
                    turn.play();
                    expect(board.move).toHaveBeenCalledWith(horse, dice.value());
                });
            });
        });

        describe('Monopoly.Movement', function () {
            var movement;

            beforeEach(function () {
                movement = new Monopoly.Movement(board, board.GO);
            });

            describe('constructor', function () {
                it('accepts a board', function () {
                    expect(movement.board).toBe(board);
                });

                it('accepts a from location', function () {
                    expect(movement.from).toBe(board.GO);
                });

                it('initializes to location to null', function () {
                    expect(movement.to).toBe(null);
                });

                it('initializes passedGo to be false', function () {
                    expect(movement.passedGo).toBe(false);
                });
            });

            describe('move', function () {
                it('determines the to location by adding the specified number of spaces', function () {
                    movement.move(5);
                    expect(movement.to).toBe(board.READING_RAILROAD);
                });

                it('determines the to location by adding the specified number of spaces, wrapping when passing GO', function () {
                    movement = new Monopoly.Movement(board, board.BOARDWALK);
                    movement.move(6);
                    expect(movement.to).toBe(board.READING_RAILROAD);
                });

                describe('passedGo', function () {
                    it('returns false if movement by spaces does not pass Go', function () {
                        movement.move(5);
                        expect(movement.passedGo).toBe(false);
                    });

                    it('returns false if movement by spaces lands on Go', function () {
                        movement = new Monopoly.Movement(board, board.BOARDWALK);
                        movement.move(1);
                        expect(movement.passedGo).toBe(false);
                    });

                    it('returns true if movement by spaces passes Go', function () {
                        movement = new Monopoly.Movement(board, board.BOARDWALK);
                        movement.move(2);
                        expect(movement.passedGo).toBe(true);
                    });
                });
            });

            describe('moveTo', function () {
                it('returns this', function () {
                    expect(movement.moveTo(board.READING_RAILROAD)).toBe(movement);
                });

                it('sets to location to the given location', function () {
                    movement.moveTo(board.READING_RAILROAD);
                    expect(movement.to).toBe(board.READING_RAILROAD);
                });

                describe('passedGo', function () {
                    it('returns false if movement to location does not pass Go', function () {
                        movement.moveTo(board.READING_RAILROAD);
                        expect(movement.passedGo).toBe(false);
                    });

                    it('returns false if movement to location lands on Go', function () {
                        movement = new Monopoly.Movement(board, board.BOARDWALK).moveTo(board.GO);
                        expect(movement.passedGo).toBe(false);
                    });

                    it('returns true if movement to location passes Go', function () {
                        movement = new Monopoly.Movement(board, board.BOARDWALK).moveTo(board.READING_RAILROAD);
                        expect(movement.passedGo).toBe(true);
                    });

                    it('can be overridden by passing in a true to moveTo', function () {
                        movement = new Monopoly.Movement(board, board.GO_TO_JAIL).moveTo(board.JAIL, true);
                        expect(movement.passedGo).toBe(false);
                    });
                });
            });
        });

        describe('Monopoly.Location', function () {
            describe('constructor', function () {
                it('accepts a name', function () {
                    var location = board.GO;
                    expect(location.name).toBe('Go');
                });

                it('accepts a group', function () {
                    var location = board.READING_RAILROAD
                    expect(location.group).toBe('Railroads');
                });

                it('accepts a landedOnStrategy', function () {
                    var location = board.GO;
                    expect(location.landedOnStrategy).not.toBeNull();
                });

                it('defaults ordinal to zero', function () {
                    var location = board.GO;
                    expect(location.ordinal).toBe(0);
                });

                it('defaults owner to null', function () {
                    var location = board.GO;
                    expect(location.owner).toBeNull();
                });

                

                describe('options', function () {
                    it('pass in landedOnStrategy', function () {
                        var landedOnStrategy = new Monopoly.RealEstateStrategy();
                        var location = new Monopoly.Location('Go', undefined, landedOnStrategy);
                        expect(location.landedOnStrategy).toBe(landedOnStrategy);
                    });
                });
            });

            describe('ordinal', function () {
                it('is set via a property', function () {
                    var location = new Monopoly.Location('Go');
                    location.ordinal = 5;
                    expect(location.ordinal).toBe(5);
                });
            });

            describe('landedOn', function () {
                it('calls landedOnStrategy.execute if landedOnStrategy exists', function () {
                    var landedOnStrategy = new Monopoly.RealEstateStrategy();
                    var location = new Monopoly.Location('Go', undefined, landedOnStrategy);
                    spyOn(landedOnStrategy, 'execute');
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.INCOME_TAX);
                    location.landedOn(movement, horse, dice);
                    expect(landedOnStrategy.execute).toHaveBeenCalledWith(movement, horse);
                });

                it('does not call landedOnStrategy.execute if no landedOnStrategy', function () {
                    var location = new Monopoly.Location('Go');
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.INCOME_TAX);
                    expect(function () {
                        location.landedOn(movement, horse);
                    }).not.toThrow();
                });
            });
        });

        describe('Monopoly.Bank', function () {
            it('constructor', function () {
                var bank = new Monopoly.Bank();
            });

            describe('setupPlayers', function () {
                it('initializes the balance of each player to $1500', function () {
                    bank.setupPlayers(players);
                    expect(players[0].balance).toBe(1500);
                    expect(players[1].balance).toBe(1500);
                });
            });

            describe('processMovement', function () {
                it('pays the player salary when passing Go', function () {
                    var balance = horse.balance;
                    var movement = new Monopoly.Movement(board, board.BOARDWALK).moveTo(board.MEDITERRANEAN_AVENUE);
                    bank.processMovement(horse, board, movement);
                    expect(horse.balance).toBe(balance + 200 - board.MEDITERRANEAN_AVENUE.landedOnStrategy.price);
                });

                it('does not pay the player salary when passing Go, but Go is to be bypassed', function () {
                    var balance = horse.balance;
                    var movement = new Monopoly.Movement(board, board.BOARDWALK).moveTo(board.MEDITERRANEAN_AVENUE, true);
                    bank.processMovement(horse, board, movement);
                    expect(horse.balance).toBe(balance - board.MEDITERRANEAN_AVENUE.landedOnStrategy.price);
                });

                it('calls landedOn for the location moved to', function () {
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.INCOME_TAX);
                    spyOn(board.INCOME_TAX, 'landedOn');
                    bank.processMovement(horse, board, movement);
                    expect(board.INCOME_TAX.landedOn).toHaveBeenCalled();
                });

                it('does not call landed on for a location passed over', function () {
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.READING_RAILROAD);
                    spyOn(board.INCOME_TAX, 'landedOn');
                    bank.processMovement(horse, board, movement);
                    expect(board.INCOME_TAX.landedOn).not.toHaveBeenCalled();
                });
            });
        });

        describe('Monopoly.Board', function () {
            describe('constructor', function () {
                it('creates 40 locations', function () {
                    expect(board.locations.length).toBe(40);
                });

                it('gives each location an ordinal number', function () {
                    _.each(board.locations, function (location, i) {
                        expect(location.ordinal).toBe(i);
                    });
                });

                it('accepts a Bank', function () {
                    expect(board.bank).toBe(bank);
                });
            });

            describe('setupPlayers', function () {
                it('accepts an array of players', function () {
                    board.setupPlayers(players);
                    expect(board.players).toBe(players);
                });

                it('creates an array of player locations', function () {
                    board.setupPlayers(players);
                    expect($.isArray(board.playerLocations)).toBe(true);
                    expect(board.playerLocations.length).toBe(2);
                });

                it('defaults player locations to Go', function () {
                    board.setupPlayers(players);
                    _.each(board.playerLocations, function (location) {
                        expect(location).toBe(board.GO);
                    });
                });

                it('delegates to bank', function () {
                    spyOn(bank, 'setupPlayers');
                    board.setupPlayers(players);
                    expect(bank.setupPlayers).toHaveBeenCalledWith(players);
                });
            });

            describe('currentLocation', function () {
                it('returns the current location of a player', function () {
                    board.setupPlayers(players);
                    expect(board.currentLocation(horse)).toBe(board.GO);
                });
            });

            describe('move', function () {
                it('moves the player the specified number of spaces', function () {
                    var balance = horse.balance;
                    board.move(horse, 5);
                    expect(board.currentLocation(horse)).toBe(board.READING_RAILROAD);
                });

                it('moves the player the specified number of spaces, passing Go', function () {                    
                    board.move(horse, 39);
                    expect(board.currentLocation(horse)).toBe(board.BOARDWALK);
                    board.move(horse, 6);
                    expect(board.currentLocation(horse)).toBe(board.READING_RAILROAD);
                });

                it('bank reacts to moving the player', function () {
                    spyOn(bank, 'processMovement');
                    board.move(horse, 40);
                    expect(bank.processMovement).toHaveBeenCalled();
                });

                it('landing on GO to Jail sends the player to Jail', function () {
                    board.move(horse, 30);
                    expect(board.currentLocation(horse)).toBe(board.JAIL);
                });

                it('when landing on GO to Jail, passing GO does not pay salary', function () {
                    var balance = horse.balance;
                    board.move(horse, 30);
                    expect(horse.balance).toBe(balance);
                });
            });

            describe('moveTo', function () {
                it('moves the player to the specified location', function () {
                    board.moveTo(horse, board.READING_RAILROAD);
                    expect(board.currentLocation(horse)).toBe(board.READING_RAILROAD);
                });

                it('moves the player to the specified location, passing Go', function () {
                    board.moveTo(horse, board.BOARDWALK);
                    expect(board.currentLocation(horse)).toBe(board.BOARDWALK);
                    board.moveTo(horse, board.READING_RAILROAD);
                    expect(board.currentLocation(horse)).toBe(board.READING_RAILROAD);
                });

                it('moves the player to the specified location, passing Go, but bypassing paying salary', function () {
                    board.moveTo(horse, board.BOARDWALK);
                    var balance = horse.balance;
                    board.moveTo(horse, board.MEDITERRANEAN_AVENUE, true);
                    expect(horse.balance).toBe(balance - board.MEDITERRANEAN_AVENUE.landedOnStrategy.price);
                });

                it('bank reacts to moving the player', function () {
                    spyOn(bank, 'processMovement');
                    board.moveTo(horse, board.BOARDWALK);
                    expect(bank.processMovement).toHaveBeenCalled();
                });

                it('landing on GO to Jail sends the player to Jail', function () {
                    board.moveTo(horse, board.GO_TO_JAIL);
                    expect(board.currentLocation(horse)).toBe(board.JAIL);
                });

                it('when landing on GO to Jail, passing GO does not pay salary', function () {
                    var balance = horse.balance;
                    board.moveTo(horse, board.GO_TO_JAIL);
                    expect(horse.balance).toBe(balance);
                });
            });

            describe('locationsByGroup', function () {
                it('returns all locations for a given group', function () {
                    var utilities = board.locationsByGroup(board.groups.Utilities);
                    expect(utilities[0]).toBe(board.ELECTRIC_COMPANY);
                    expect(utilities[1]).toBe(board.WATER_WORKS);
                });
            });
        });

        describe('Monopoly.IncomeTaxStrategy', function () {
            var landedOnStrategy, movement;

            beforeEach(function () {
                strategy = new Monopoly.IncomeTaxStrategy();
                movement = new Monopoly.Movement(board, board.GO).moveTo(board.INCOME_TAX);
            });

            describe('execute', function () {
                it('deducts 10% if balance < 2000', function () {
                    var balance = horse.balance;
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(balance * 0.9);
                });

                it('deducts $200 if balance > 2000', function () {
                    horse.pay(700);
                    var balance = horse.balance;
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(balance - 200);
                });

                it('deducts $0 if balance = $0', function () {
                    horse.charge(1500);
                    strategy.execute(movement, horse, dice);
                    expect(horse.balance).toBe(0);
                });

                it('deducts $200 if balance = $2000', function () {
                    horse.pay(500);
                    var balance = horse.balance;
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(balance - 200);
                });
            });
        });

        describe('Monopoly.LuxuryTaxStrategy', function () {
            var strategy, movement;

            beforeEach(function () {
                strategy = new Monopoly.LuxuryTaxStrategy();
                movement = new Monopoly.Movement(board, board.GO).moveTo(board.LUXURY_TAX);
            });

            describe('execute', function () {
                it('deducts $75 if balance > 2000', function () {
                    horse.pay(600);
                    var balance = horse.balance;
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(balance - 75);
                });

                it('deducts $75 if balance = 75', function () {
                    horse.charge(1425);
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(0);
                });

                it('deducts full amount if balance < 75', function () {
                    horse.charge(1450);
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(0);
                });

                it('deducts $0 if balance = $0', function () {
                    horse.charge(1500);
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(0);
                });
            });
        });

        describe('Monopoly.RealEstateStrategy', function () {
            var strategy, movement;

            beforeEach(function () {
                strategy = new Monopoly.RealEstateStrategy(300);
                movement = new Monopoly.Movement(board, board.GO).moveTo(board.PACIFIC_AVENUE);
            });

            describe('constructor', function () {
                it('accepts a price', function () {
                    expect(strategy.price).toBe(300);
                });
            });

            describe('execute', function () {
                it('calls player.buy() if property is unowned', function () {
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.PACIFIC_AVENUE);
                    spyOn(horse, 'buy');
                    strategy.execute(movement, horse);
                    expect(horse.buy).toHaveBeenCalledWith(board.PACIFIC_AVENUE, strategy.price);
                });

                it('does not call player.buy() if property is owned by player', function () {
                    board.PACIFIC_AVENUE.owner = horse;
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.PACIFIC_AVENUE);
                    spyOn(horse, 'buy');
                    strategy.execute(movement, horse);
                    expect(horse.buy).not.toHaveBeenCalledWith(board.PACIFIC_AVENUE, strategy.price);
                });

                it('does not call player.buy() if property is owned by another player', function () {
                    board.PACIFIC_AVENUE.owner = car;
                    var movement = new Monopoly.Movement(board, board.GO).moveTo(board.PACIFIC_AVENUE);
                    spyOn(horse, 'buy');
                    strategy.execute(movement, horse);
                    expect(horse.buy).not.toHaveBeenCalledWith(board.PACIFIC_AVENUE, strategy.price);
                });
            });
        });

        describe('Monopoly.GoStrategy', function () {
            var strategy, movement;

            beforeEach(function () {
                strategy = new Monopoly.GoStrategy();
                movement = new Monopoly.Movement(board, board.PACIFIC_AVENUE).moveTo(board.GO);
            });

            describe('execute', function () {
                it('pays the player salary when landing on Go', function () {
                    var balance = horse.balance;
                    strategy.execute(movement, horse);
                    expect(horse.balance).toBe(balance + 200);
                });
            });
        });
    });
});
