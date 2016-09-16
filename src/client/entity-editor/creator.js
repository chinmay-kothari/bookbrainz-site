/*
 * Copyright (C) 2016  Ben Ockmore
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import CreatorData from './creator-data';
import Immutable from 'immutable';
import {Provider} from 'react-redux';
import React from 'react';
import {createStore} from 'redux';

function reducer(
	state = Immutable.Map({
		nameValue: '',
		sortNameValue: '',
		aliases: Immutable.Map(),
		languageValue: null,
		disambiguationVisible: false,
		aliasEditorVisible: false
	}),
	action
) {
	switch (action.type) {
		case 'UPDATE_NAME_FIELD':
			return state.set('nameValue', action.value);
		case 'UPDATE_SORT_NAME_FIELD':
			return state.set('sortNameValue', action.value);
		case 'UPDATE_LANGUAGE_FIELD':
			return state.set('languageValue', action.value);
		case 'SHOW_DISAMBIGUATION':
			return state.set('disambiguationVisible', true);
		case 'SHOW_ALIAS_EDITOR':
			return state.set('aliasEditorVisible', true);
		case 'HIDE_ALIAS_EDITOR':
			return state.set('aliasEditorVisible', false);
		case 'ADD_ALIAS':
			return state.update('aliases', (aliases) =>
				aliases.set(action.id, Immutable.Map({
					id: action.id,
					name: '',
					sortName: ''
				}))
			);
		case 'UPDATE_ALIAS_NAME':
			return state.setIn(['aliases', action.index, 'name'], action.value);
		case 'UPDATE_ALIAS_SORT_NAME':
			return state.setIn(
				['aliases', action.index, 'sortName'],
				action.value
			);
		case 'UPDATE_ALIAS_LANGUAGE':
			return state.setIn(
				['aliases', action.index, 'language'],
				action.value
			);
		case 'UPDATE_ALIAS_PRIMARY':
			return state.setIn(
				['aliases', action.index, 'primary'],
				action.value
			);
		// no default
	}
	return state;
}

const store = createStore(reducer, Immutable.Map({
	nameValue: '',
	sortNameValue: '',
	aliases: Immutable.List(),
	languageValue: null,
	disambiguationVisible: false,
	aliasEditorVisible: false
}), window.devToolsExtension && window.devToolsExtension());

const Creator = ({
	languages
}) => (
	<Provider store={store}>
		<CreatorData languageOptions={languages}/>
	</Provider>
);
Creator.displayName = 'Creator';
Creator.propTypes = {
	languages: React.PropTypes.array
};

export default Creator;
