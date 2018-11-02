export const search = {

    namespaced: true,

    state: {

        // If the user is currently searching for somenthing
        active: false,

        /**
         * Search options, mutations are coming from
         * the buttons below the serach bar.
         */
        options: {
            type: 'all',
            regex: false
        },

        // Search result
        nodes: []
    },

    mutations: {

        /**
         * Sets a option property
         * @param state
         * @param key
         * @param value
         */
        setOption(state, {key, value}) {
            state.options[key] = value;
        }

    },

    actions: {

        /**
         * Updates the current search
         * @param state
         * @param rootState
         * @param rawQuery
         */
        update({state, rootState}, rawQuery) {

            // If the query is empty, search should be disabled
            state.active = !!rawQuery;

            if (state.active) {

                /**
                 * Parse query. Filters contains a associative array where
                 * the key is the filter prop and the value is an array.
                 * Supported filters are:
                 *     is: <FileExtension>
                 *
                 * Query is the search value without filter strings.
                 */
                const {filters, query} = parseQuery(rawQuery);

                // Extract options
                let {type, regex, ignoreCase} = state.options;

                // Check if regexp and try to parse
                if (regex) {
                    try {
                        query = new RegExp(query, ignoreCase ? 'i' : '');
                    } catch (e) {
                        console.log(`[SRH] Invalid RegExp skipped: '${query}'`);
                        state.active = false;
                        return;
                    }
                }

                // Extract and prepare filters
                // TODO: Help page with list of filters, maybe next to keyboard shortcuts icon
                const {is} = filters;

                // Convert to lowercase if ignorecase is set
                if (ignoreCase) {
                    query = query.toLowerCase();
                }

                state.nodes = [];
                const nodes = rootState.nodes;
                for (let i = 0, a = nodes.length, n; n = nodes[i], i < a; i++) {

                    // Check type
                    if (type !== 'all' && n.type !== type) {
                        continue;
                    }

                    // Check filters
                    if (is && is.length && !is.includes(n.name.replace(/.*\./, ''))) {
                        continue;
                    }

                    // Check for regex
                    if (regex && query.test(n.name)) {
                        state.nodes.push(n);
                    } else if (ignoreCase && n.name.toLowerCase().includes(query)) {
                        state.nodes.push(n);
                    } else if (n.name.includes(query)) {
                        state.nodes.push(n);
                    }
                }
            }
        }
    }
};

// See inline-usage documentation
function parseQuery(query) {
    const filterRegex = /([\w]+):([\w,]+)( |$)/g;
    const rawFilters = matchAll(query, filterRegex);
    const filters = {};

    for (let filter of rawFilters) {

        // Skip invalid matches
        if (filter.length < 3) {
            continue;
        }

        const type = filter[1];
        const val = filter[2].trim().split(',');
        filters[type] = val;
    }

    /**
     * Executes a regular expression on a string and
     * returns all matches as array.
     *
     * @param str
     * @param regex
     * @returns {Array}
     */
    function matchAll(str, regex) {
        const matches = [];
        for (let match; match = regex.exec(str); matches.push(match)) ;
        return matches;
    }

    return {
        filters,
        query: query.replace(filterRegex, '') // Return query without filters
    };
}
