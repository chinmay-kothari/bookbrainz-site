/*
 * Copyright (C) 2015-2016  Stanisław Szcześniak
 *               2015-2016  Ben Ockmore
 *               2016       Sean Burke
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

import * as bootstrap from 'react-bootstrap';
import * as utilsHelper from '../../helpers/utils';

import CustomInput from '../../input';
import EntityLink from '../entity-link';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import request from 'superagent-bluebird-promise';
import {transformISODateForDisplay} from '../../helpers/entity';


const {Button, Col, ListGroup, ListGroupItem, Row} = bootstrap;
const {formatDate} = utilsHelper;

class RevisionPage extends React.Component {
	static formatValueList(list, isChangeADate) {
		if (!list) {
			return null;
		}
		return list.map(
			(val, idx) => {
				const formattedValue = isChangeADate ? transformISODateForDisplay(val) : val.toString();
				return <div key={`${idx}${val}`}>{formattedValue}</div>;
			}
		);
	}

	static formatChange(change) {
		const isChangeADate = change.key.toLowerCase().match(/\bdate\b/);
		if (change.kind === 'N') {
			return (
				<tr className="success" key={change.key}>
					<th scope="row">{change.key}</th>
					<td> — </td>
					<td>
						{RevisionPage.formatValueList(change.rhs, isChangeADate)}
					</td>
				</tr>
			);
		}

		if (change.kind === 'E') {
			return (
				<tr className="warning" key={change.key}>
					<th scope="row">{change.key}</th>
					<td>
						{RevisionPage.formatValueList(change.lhs, isChangeADate)}
					</td>
					<td>
						{RevisionPage.formatValueList(change.rhs, isChangeADate)}
					</td>
				</tr>
			);
		}

		if (change.kind === 'D') {
			return (
				<tr className="danger" key={change.key}>
					<th scope="row">{change.key}</th>
					<td>
						{RevisionPage.formatValueList(change.lhs, isChangeADate)}
					</td>
					<td> — </td>
				</tr>
			);
		}

		return null;
	}

	static formatDiff(diff) {
		const result = diff.changes.map(
			(change) =>
				RevisionPage.formatChange(change)
		);

		return _.compact(result);
	}

	static formatTitle(author) {
		let title;
		if (_.get(author, ['titleUnlock', 'title'], null)) {
			const authorTitle = author.titleUnlock.title;
			title = `${authorTitle.title}: ${authorTitle.description}`;
		}
		else {
			title = 'No Title Set: This user hasn\'t selected a title';
		}
		return title;
	}

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(event) {
		event.preventDefault();
		const data = {
			note: this.noteInput.getValue()
		};
		request.post(`/revision/${this.props.revision.id}/note`)
			.send(data).promise()
			.then(() => {
				location.reload();
			})
			.catch((res) => {
				// TODO: Add proper error handling.
				const {error} = res.body;
				return error;
			});
	}

	render() {
		const {revision, revisionParents, diffs, user} = this.props;

		const diffDivs = diffs.map((diff, index) => (
			<div key={`${diff.entity.bbid}${index}`}>
				<h3>
					<EntityLink
						bbid={diff.entity.bbid}
						text={`${diff.entity.type} ${diff.entity.bbid}`}
						type={diff.entity.type}
					/>
				</h3>
				<table className="table table-bordered text-center">
					<tbody>
						{RevisionPage.formatDiff(diff)}
					</tbody>
				</table>
			</div>
		));

		const editorTitle =
			RevisionPage.formatTitle(revision.author);

		let revisionNotes = revision.notes.map((note) => {
			const timeCreated = formatDate(new Date(note.postedAt), true);
			const noteAuthorTitle =
				RevisionPage.formatTitle(note.author);
			return (
				<ListGroupItem
					key={note.id}
				>
					<div>
						<p>{note.content}</p>
						<p className="text-right">
							—&nbsp;
							<a
								href={`/editor/${note.author.id}`}
								title={noteAuthorTitle}
							>
								{note.author.name}
							</a>
							, {`${timeCreated}`}
						</p>
					</div>
				</ListGroupItem>
			);
		});

		if (revisionNotes.length === 0) {
			revisionNotes = <p> No revision notes present </p>;
		}

		const dateRevisionCreated = formatDate(new Date(revision.createdAt), true);
		const parentEntitiesLinks = revisionParents.map(parentEntity =>
			 _.get(parentEntity, ['data.aliasSet.defaultAlias.name'], null)
			// (<EntityLink
			// 	bbid={entity.bbid}
			// 	key={`parent-${entity.bbid}`}
			// 	text={entity.data.aliasSet.defaultAlias.name}
			// 	type={entity.type}
			// />);
		);
		const parentRevLinks = revision.parents && revision.parents.map(parentRev =>
			<a href={`/revision/${parentRev.id}`} key={parentRev.id}>#{parentRev.id}</a>);
		return (
			<Row>
				<Col md={12}>
					<h1>Revision #{revision.id}</h1>
					{parentEntitiesLinks.length > 1 &&
						// .join will return objects so use reduce instead
						<h3>
							Merge between {parentEntitiesLinks.reduce((prev, curr) => [prev, ', ', curr])}
						</h3>
					}
					{parentRevLinks && parentRevLinks.length > 1 &&
						<h5>Merge between revisions {parentRevLinks.reduce((prev, curr) => [prev, ', ', curr])}</h5>
					}
					{diffDivs}
					<p className="text-right">
						Created by&nbsp;
						<a
							href={`/editor/${revision.author.id}`}
							title={editorTitle}
						>
							{revision.author.name}
						</a>
						, {dateRevisionCreated}
					</p>

					<h3>Revision Notes</h3>
					<ListGroup>
						{revisionNotes}
					</ListGroup>
					{user &&
						<form
							className="margin-top-2"
							onSubmit={this.handleSubmit}
						>
							<CustomInput
								label="Add Note"
								ref={(ref) => this.noteInput = ref}
								rows="6"
								type="textarea"
							/>
							<Button
								bsStyle="primary"
								className="pull-right margin-top-1"
								title="Submit revision note"
								type="submit"
							>
								Submit
							</Button>
						</form>
					}
				</Col>
			</Row>
		);
	}
}

RevisionPage.displayName = 'RevisionPage';
RevisionPage.propTypes = {
	diffs: PropTypes.any.isRequired,
	revision: PropTypes.any.isRequired,
	revisionParents: PropTypes.array,
	user: PropTypes.object
};
RevisionPage.defaultProps = {
	revisionParents: [],
	user: null
};

export default RevisionPage;
