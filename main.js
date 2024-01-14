const set_error = (el, msg) => {
    el[0].setCustomValidity(msg);
}

const float_to_hhmm = (float) => Math.floor(float) + 'h ' + Math.floor(float * 60 % 60) + 'm';

const time_value_of = (input_timer) => new Date(new Date().toDateString() + ' ' + input_timer.val());

const time_of = (el) => [
    time_value_of(el.children('#start')),
    time_value_of(el.children('#end')),
];

const to_float = (date) => date.getHours() + (date.getMinutes() / 60);

const make_time = (float) =>
    String(Math.floor(float)).padStart(2, '0') + ':' +
    String(Math.floor(float * 60 % 60)).padStart(2, '0');

const display_total_hours = () => {
    const entries = get_entries();
    const total_time = entries.reduce((total, current) => total + (current.end - current.start), 0);

    $('#total_time').text(float_to_hhmm(total_time));
};

const get_entries = () => {
    return $('.time_entry:not(.hidden)').get().reduce((entries, entry) => {
        const [start, end] = time_of($(entry));
        entries.push({start: to_float(start), end: to_float(end)});
        return entries;
    }, []);
};

const time_add_entry = (start_t, end_t) => {
    let cloned = $('.time_entry.hidden').clone().removeClass('hidden');
    cloned.children('.time_entry_deleter').click(() => cloned.remove());
    cloned.children('input[type=time]').each((_, el) => {
        const start = cloned.children('#start');
        const end = cloned.children('#end');
        $(el).on('input', () => {
            let start_t = time_value_of(start);
            let end_t = time_value_of(end);

            const invalid = start_t > end_t;

            set_error(start, invalid ? 'start after end' : '');
            set_error(end, invalid ? 'start after end' : '');

            if (!invalid) {
                display_total_hours();
                cloned.children('#session_time').text(float_to_hhmm(to_float(end_t) - to_float(start_t)));
            }
        });

        start[0].dispatchEvent(new Event('input'));

        const now = new Date();
        if (start_t == undefined)
            start_t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        
        if (end_t == undefined)
            end_t = start_t;

        start.val(start_t);
        end.val(end_t);
    });
    $('#time_entries_list').append(cloned);
};
time_add_entry();

const time_export_entry = () => {
    const entries = get_entries();
    const formatted = entries.map((entry) => `(${entry.end}-${entry.start})`);

    let formula = '=(' + formatted.join('+') + ')*60';
    if ($('#separator').val() == 'comma')
        formula = formula.replaceAll('.',',');

    prompt('Exported time data:', formula);
};

const import_from_formula = () => {
    let formula = prompt('Enter formula:');
    if (formula == null)
        return;

    if (formula.includes(','))
        formula = formula.replaceAll(',','.');

    // remove outer =(X)*60
    const without_decl = formula.substring(2, formula.length - 4);
    const spliced = without_decl.split('+');
    
    $('.time_entry:not(.hidden)').remove();
    for (const splice of spliced) {
        const without_parentheses = splice.substring(1, splice.length - 1);
        const [end, start] = without_parentheses.split('-');

        // make time
        const start_t = make_time(start);
        const end_t = make_time(end);

        time_add_entry(start_t, end_t);
    }

    display_total_hours();
};
