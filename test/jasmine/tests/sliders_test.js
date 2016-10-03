var Sliders = require('@src/components/sliders');
var constants = require('@src/components/sliders/constants');

var d3 = require('d3');
var Plotly = require('@lib');
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('sliders defaults', function() {
    'use strict';

    var supply = Sliders.supplyLayoutDefaults;

    var layoutIn, layoutOut;

    beforeEach(function() {
        layoutIn = {};
        layoutOut = {};
    });

    it('should set \'visible\' to false when no steps are present', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }, {
                method: 'update',
                args: [ { 'marker.size': 20 }, { 'xaxis.range': [0, 10] }, [0, 1] ]
            }, {
                method: 'animate',
                args: [ 'frame1', { transition: { duration: 500, ease: 'cubic-in-out' }}]
            }]
        }, {
            bgcolor: 'red'
        }, {
            visible: false,
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].visible).toBe(true);
        expect(layoutOut.sliders[0].active).toEqual(0);
        expect(layoutOut.sliders[0].steps[0].args.length).toEqual(2);
        expect(layoutOut.sliders[0].steps[1].args.length).toEqual(3);
        expect(layoutOut.sliders[0].steps[2].args.length).toEqual(2);

        expect(layoutOut.sliders[1].visible).toBe(false);
        expect(layoutOut.sliders[1].active).toBeUndefined();

        expect(layoutOut.sliders[2].visible).toBe(false);
        expect(layoutOut.sliders[2].active).toBeUndefined();
    });

    it('should set the default values equal to the labels', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'relayout', args: [],
                label: 'Label #1',
                value: 'label-1'
            }, {
                method: 'update', args: [],
                label: 'Label #2'
            }, {
                method: 'animate', args: [],
                value: 'lacks-label'
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps.length).toEqual(3);
        expect(layoutOut.sliders[0].steps).toEqual([{
            method: 'relayout', args: [],
            label: 'Label #1',
            value: 'label-1'
        }, {
            method: 'update', args: [],
            label: 'Label #2',
            value: 'Label #2'
        }, {
            method: 'animate', args: [],
            label: 'step-2',
            value: 'lacks-label'
        }]);
    });

    it('should skip over non-object steps', function() {
        layoutIn.sliders = [{
            steps: [
                null,
                {
                    method: 'relayout',
                    args: ['title', 'Hello World']
                },
                'remove'
            ]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps.length).toEqual(1);
        expect(layoutOut.sliders[0].steps[0]).toEqual({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
        });
    });

    it('should skip over steps with non-array \'args\' field', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'restyle',
            }, {
                method: 'relayout',
                args: ['title', 'Hello World']
            }, {
                method: 'relayout',
                args: null
            }, {}]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].steps.length).toEqual(1);
        expect(layoutOut.sliders[0].steps[0]).toEqual({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: 'step-1',
            value: 'step-1',
        });
    });

    it('should keep ref to input update menu container', function() {
        layoutIn.sliders = [{
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }, {
            bgcolor: 'red'
        }, {
            visible: false,
            steps: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0]._input).toBe(layoutIn.sliders[0]);
        expect(layoutOut.sliders[1]._input).toBe(layoutIn.sliders[1]);
        expect(layoutOut.sliders[2]._input).toBe(layoutIn.sliders[2]);
    });

    it('should default \'bgcolor\' to layout \'paper_bgcolor\'', function() {
        var steps = [{
            method: 'relayout',
            args: ['title', 'Hello World']
        }];

        layoutIn.sliders = [{
            steps: steps,
        }, {
            bgcolor: 'red',
            steps: steps
        }];

        layoutOut.paper_bgcolor = 'blue';

        supply(layoutIn, layoutOut);

        expect(layoutOut.sliders[0].bgcolor).toEqual('blue');
        expect(layoutOut.sliders[1].bgcolor).toEqual('red');
    });
});

describe('update sliders interactions', function() {
    'use strict';

    var mock = require('@mocks/sliders.json');

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should draw only visible sliders', function(done) {
        expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
        expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();

        Plotly.relayout(gd, 'sliders[0].visible', false).then(function() {
            assertNodeCount('.' + constants.groupClassName, 1);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();

            return Plotly.relayout(gd, 'sliders[1]', null);
        })
        .then(function() {
            assertNodeCount('.' + constants.groupClassName, 0);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeUndefined();

            return Plotly.relayout(gd, {
                'sliders[0].visible': true,
                'sliders[1].visible': true
            });
        }).then(function() {
            assertNodeCount('.' + constants.groupClassName, 1);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeUndefined();

            return Plotly.relayout(gd, {
                'sliders[1]': {
                    steps: [{
                        method: 'relayout',
                        args: ['title', 'new title'],
                        label: '1970'
                    }, {
                        method: 'relayout',
                        args: ['title', 'new title'],
                        label: '1971'
                    }]
                }
            });
        })
        .then(function() {
            assertNodeCount('.' + constants.groupClassName, 2);
            expect(gd._fullLayout._pushmargin['slider-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['slider-1']).toBeDefined();
        })
        .catch(fail).then(done);
    });

    function assertNodeCount(query, cnt) {
        expect(d3.selectAll(query).size()).toEqual(cnt);
    }
});

describe('updateevent and updatevalue', function() {
    'use strict';

    var mock = require('@mocks/sliders.json');

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.layout.sliders[0].updateevent = 'plotly_someevent';
        mockCopy.layout.sliders[0].updateevent = 'plotly_someevent';

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('updates a slider when an event is triggered', function(done) {
        Plotly.relayout(gd, {
            'sliders[0].updateevent': 'plotly_someevent',
            'sliders[0].updatevalue': 'value'
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(2);
            gd.emit('plotly_someevent', {value: 'green'});
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(3);
        }).catch(fail).then(done);
    });

    it('updates a slider when updatevalue unspecified', function(done) {
        Plotly.relayout(gd, {
            'sliders[0].updateevent': 'plotly_someevent'
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(2);
            gd.emit('plotly_someevent', 'green');
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(3);
        }).catch(fail).then(done);
    });

    it('updates a slider when any of multiple updateevents occurs', function(done) {
        Plotly.relayout(gd, {
            'sliders[0].updateevent': ['plotly_someevent', 'plotly_anotherevent']
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(2);
            gd.emit('plotly_someevent', 'green');
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(3);
            gd.emit('plotly_anotherevent', 'yellow');
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(2);
        }).catch(fail).then(done);
    });

    it('matches update events with update values', function(done) {
        Plotly.relayout(gd, {
            'sliders[0].updateevent': ['plotly_someevent', 'plotly_anotherevent'],
            'sliders[0].updatevalue': ['foo', 'bar']
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(2);
            gd.emit('plotly_someevent', {foo: 'green'});
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(3);
            gd.emit('plotly_anotherevent', {bar: 'yellow'});
        }).then(function() {
            expect(gd._fullLayout.sliders[0].active).toEqual(2);
        }).catch(fail).then(done);
    });
});
