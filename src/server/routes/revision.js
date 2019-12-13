/*
 * Copyright (C) 2015-2016  Ben Ockmore
 *               2016       Sean Burke
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as baseFormatter from '../helpers/diffFormatters/base';
import * as entityFormatter from '../helpers/diffFormatters/entity';
import * as entityRoutes from './entity/entity';
import * as error from '../../common/helpers/error';
import * as languageSetFormatter from '../helpers/diffFormatters/languageSet';
import * as propHelpers from '../../client/helpers/props';
import * as publisherSetFormatter from '../helpers/diffFormatters/publisherSet';
import * as releaseEventSetFormatter from
	'../helpers/diffFormatters/releaseEventSet';

import {escapeProps, generateProps} from '../helpers/props';
import Layout from '../../client/containers/layout';
import Promise from 'bluebird';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import RevisionPage from '../../client/components/pages/revision';
import _ from 'lodash';
import express from 'express';
import log from 'log';
import target from '../templates/target';


const router = express.Router();

function formatAuthorChange(change) {
	if (_.isEqual(change.path, ['beginDate'])) {
		return baseFormatter.formatScalarChange(change, 'Begin Date');
	}

	if (_.isEqual(change.path, ['endDate'])) {
		return baseFormatter.formatScalarChange(change, 'End Date');
	}

	if (_.isEqual(change.path, ['gender'])) {
		return baseFormatter.formatGenderChange(change);
	}

	if (_.isEqual(change.path, ['ended'])) {
		return baseFormatter.formatEndedChange(change);
	}

	if (_.isEqual(change.path, ['type'])) {
		return baseFormatter.formatTypeChange(change, 'Author Type');
	}

	if (_.isEqual(change.path, ['beginArea']) ||
			_.isEqual(change.path, ['beginArea', 'name'])) {
		return baseFormatter.formatAreaChange(change, 'Begin Area');
	}

	if (_.isEqual(change.path, ['endArea']) ||
			_.isEqual(change.path, ['endArea', 'name'])) {
		return baseFormatter.formatAreaChange(change, 'End Area');
	}

	return null;
}

function formatEditionChange(change) {
	if (_.isEqual(change.path, ['editionGroupBbid'])) {
		return baseFormatter.formatScalarChange(change, 'EditionGroup');
	}

	if (publisherSetFormatter.changed(change)) {
		return publisherSetFormatter.format(change);
	}

	if (releaseEventSetFormatter.changed(change)) {
		return releaseEventSetFormatter.format(change);
	}

	if (languageSetFormatter.changed(change)) {
		return languageSetFormatter.format(change);
	}

	if (_.isEqual(change.path, ['width']) ||
			_.isEqual(change.path, ['height']) ||
			_.isEqual(change.path, ['depth']) ||
			_.isEqual(change.path, ['weight'])) {
		return baseFormatter.formatScalarChange(
			change, _.startCase(change.path[0])
		);
	}

	if (_.isEqual(change.path, ['pages'])) {
		return baseFormatter.formatScalarChange(change, 'Page Count');
	}

	if (_.isEqual(change.path, ['editionFormat'])) {
		return baseFormatter.formatTypeChange(change, 'Edition Format');
	}

	if (_.isEqual(change.path, ['editionStatus'])) {
		return baseFormatter.formatTypeChange(change, 'Edition Status');
	}

	return null;
}

function formatPublisherChange(change) {
	if (_.isEqual(change.path, ['beginDate'])) {
		return baseFormatter.formatScalarChange(change, 'Begin Date');
	}

	if (_.isEqual(change.path, ['endDate'])) {
		return baseFormatter.formatScalarChange(change, 'End Date');
	}

	if (_.isEqual(change.path, ['ended'])) {
		return baseFormatter.formatEndedChange(change);
	}

	if (_.isEqual(change.path, ['type'])) {
		return baseFormatter.formatTypeChange(change, 'Publisher Type');
	}

	if (_.isEqual(change.path, ['area']) ||
			_.isEqual(change.path, ['area', 'name'])) {
		return baseFormatter.formatAreaChange(change);
	}

	return null;
}

function formatWorkChange(change) {
	if (languageSetFormatter.changed(change)) {
		return languageSetFormatter.format(change);
	}

	if (_.isEqual(change.path, ['type'])) {
		return baseFormatter.formatTypeChange(change, 'Work Type');
	}

	return null;
}

function formatEditionGroupChange(change) {
	if (_.isEqual(change.path, ['type'])) {
		return baseFormatter.formatTypeChange(change, 'Edition Group Type');
	}

	return [];
}

function diffRevisionsWithParents(entityRevisions) {
	// entityRevisions - collection of *entityType*_revisions matching id
	return Promise.all(entityRevisions.map(
		(revision) =>
			revision.parent()
				.then(
					(parent) => Promise.props({
						changes: revision.diff(parent),
						entity: revision.related('entity'),
						revision
					})
				)
	));
}

router.get('/:id', async (req, res, next) => {
	const {
		AuthorRevision, EditionRevision, EditionGroupRevision,
		PublisherRevision, Revision, WorkRevision
	} = req.app.locals.orm;

	let revision;
	function _createRevision(EntityRevisionModel) {
		/**
		 * EntityRevisions can have duplicate ids
		 * the 'merge' and 'remove' options instructs the ORM to consider that normal instead of merging
		 * see https://github.com/bookshelf/bookshelf/pull/1846
		 */
		return EntityRevisionModel.forge()
			.where('id', req.params.id)
			.fetchAll({merge: false, remove: false, require: false, withRelated: 'entity'})
			.then(diffRevisionsWithParents)
			.catch(error => { log.error(error); throw error; });
	}
	try {
		/*
		* Here, we need to get the Revision, then get all <Entity>Revision
		* objects with the same ID, formatting each revision individually, then
		* concatenating the diffs
		*/
		revision = await new Revision({id: req.params.id})
			.fetch({
				withRelated: [
					'author', 'author.titleUnlock.title', 'notes', 'notes.author',
					'notes.author.titleUnlock.title'
				]
			});

		const authorDiffs = await _createRevision(AuthorRevision);
		const editionDiffs = await _createRevision(EditionRevision);
		const editionGroupDiffs = await _createRevision(EditionGroupRevision);
		const publisherDiffs = await _createRevision(PublisherRevision);
		const workDiffs = await _createRevision(WorkRevision);
		const diffs = _.concat(
			entityFormatter.formatEntityDiffs(
				authorDiffs,
				'Author',
				formatAuthorChange
			),
			entityFormatter.formatEntityDiffs(
				editionDiffs,
				'Edition',
				formatEditionChange
			),
			entityFormatter.formatEntityDiffs(
				editionGroupDiffs,
				'EditionGroup',
				formatEditionGroupChange
			),
			entityFormatter.formatEntityDiffs(
				publisherDiffs,
				'Publisher',
				formatPublisherChange
			),
			entityFormatter.formatEntityDiffs(
				workDiffs,
				'Work',
				formatWorkChange
			)
		);

		const props = generateProps(req, res, {
			diffs,
			revision: revision.toJSON(),
			title: 'RevisionPage'
		});

		const markup = ReactDOMServer.renderToString(
			<Layout {...propHelpers.extractLayoutProps(props)}>
				<RevisionPage
					diffs={props.diffs}
					revision={props.revision}
					user={props.user}
				/>
			</Layout>
		);

		const script = '/js/revision.js';

		return res.send(target({
			markup,
			props: escapeProps(props),
			script
		}));
	 }
	catch (error) {
		return next(error);
	 }
});

router.post('/:id/note', (req, res) => {
	entityRoutes.addNoteToRevision(req, res);
});

export default router;
