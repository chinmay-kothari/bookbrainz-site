/*
 * Copyright (C) 2015-2017  Ben Ockmore
 *               2015-2016  Sean Burke
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

import * as PropTypes from 'prop-types';
import * as React from 'react';
import {kebabCase as _kebabCase, has, isFunction} from 'lodash';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {genEntityIconHTMLElement} from '../../helpers/entity';


class LinkedEntity extends React.Component<any, any> {
	static displayName = 'LinkedEntity';

	static propTypes = {
		className: PropTypes.string,
		onSelect: PropTypes.func.isRequired,
		option: PropTypes.object.isRequired
	};

	static defaultProps = {
		className: ''
	};

	constructor(props) {
		super(props);

		this.handleParentEvent = this.handleParentEvent.bind(this);
		this.handleChildEvent = this.handleChildEvent.bind(this);
	}

	handleParentEvent(event) {
		const option = this.getSafeOptionValue(this.props.option);
		if (isFunction(this.props.onSelect)) {
			this.props.onSelect(option, event);
		}
	}

	handleChildEvent(event) {
		event.stopPropagation();
		event.preventDefault();
		let url = null;
		const option = this.getSafeOptionValue(this.props.option);
		const type = option && option.type;
		const id = option && option.id;
		if (type && id) {
			url = type.toLowerCase() === 'area' ?
				`//musicbrainz.org/area/${id}` :
				`/${_kebabCase(type)}/${id}`;
		}
		if (url) {
			window.open(url, '_blank');
		}
	}

	getSafeOptionValue(optionToCheck) {
		if (has(optionToCheck, 'value') && has(optionToCheck, 'label')) {
			return optionToCheck.value;
		}
		return optionToCheck;
	}

	render() {
		const option = this.getSafeOptionValue(this.props.option);
		const {disambiguation, text, type, unnamedText, language} = option;

		const nameComponent = text || <i>{unnamedText}</i>;

		return (
			<div className={this.props.className} onClick={this.handleParentEvent}>
				{
					type && genEntityIconHTMLElement(type)
				}
				&nbsp;
				{nameComponent}
				&nbsp;&nbsp;
				{
					disambiguation &&
					<span className="disambig"><small>({disambiguation})</small></span>
				}
				{' '}
				<a onClick={this.handleChildEvent}>
					<FontAwesomeIcon icon="external-link-alt"/>
				</a>
				<span className="text-muted small" style={{float: 'right'}}>{language}</span>
			</div>
		);
	}
}

export default LinkedEntity;
