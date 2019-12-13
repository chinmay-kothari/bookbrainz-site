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

import AliasRowMerge from './alias-row-merge';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';

/**
 * Container component. The AliasEditorMerge component contains a number of AliasRow
 * elements, and renders these inside a modal, which appears when the show
 * property of the component is set.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {Array} props.aliases - The list of aliases to be rendered in the
 *        editor.
 * @param {Array} props.languageOptions - The list of possible languages for an
 *        alias.
 * @param {Function} props.onAddAlias - A function to be called when the button
 *        to add an alias is clicked.
 * @param {Function} props.onClose - A function to be called when the button to
 *        close the editor is clicked.
 * @param {boolean} props.show - Whether or not the editor modal should be
 *        visible.
 * @returns {ReactElement} React element containing the rendered AliasEditorMerge.
 */
const AliasEditorMerge = ({
	aliases,
	languageOptions
}) => {
	const languageOptionsForDisplay = {};
	languageOptions.forEach((language) => (languageOptionsForDisplay[language.id] = language.name));

	const noAliasesTextClass =
		classNames('text-center', {hidden: aliases.size});
	return (
		<React.Fragment>
			<h2>Aliases</h2>
			<div className={noAliasesTextClass}>
				<p className="text-muted">This entity has no aliases</p>
			</div>
			{
				aliases.map((alias, rowId) => (
					<AliasRowMerge
						index={rowId}
						key={rowId}
						languageOptions={languageOptionsForDisplay}
					/>
				)).toArray()
			}
		</React.Fragment>
	);
};
AliasEditorMerge.displayName = 'AliasEditorMerge';
AliasEditorMerge.propTypes = {
	aliases: PropTypes.object.isRequired,
	languageOptions: PropTypes.array.isRequired
};

function mapStateToProps(rootState) {
	return {
		aliases: rootState.get('aliasEditor')
	};
}

export default connect(mapStateToProps)(AliasEditorMerge);
