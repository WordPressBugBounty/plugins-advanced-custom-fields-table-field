var ACFTableField = {};

(function($) {

	function ACFTableFieldMain() {

		var t = this;

		t.version = '1.5.2';

		t.param = {};

		// DIFFERENT IN ACF VERSION 4 and 5 {

			t.param.classes = {

				btn_small:		'acf-icon small',
				// "acf-icon-plus" becomes "-plus" since ACF Pro Version 5.3.2
				btn_add_row:	'acf-icon-plus -plus',
				btn_add_col:	'acf-icon-plus -plus',
				btn_remove_row:	'acf-icon-minus -minus',
				btn_remove_col:	'acf-icon-minus -minus',
			};

			t.param.htmlbuttons = {

				add_row:		'<a href="#" class="acf-table-add-row ' + t.param.classes.btn_small + ' ' + t.param.classes.btn_add_row + '"></a>',
				remove_row:		'<a href="#" class="acf-table-remove-row ' + t.param.classes.btn_small + ' ' + t.param.classes.btn_remove_row + '"></a>',
				add_col:		'<a href="#" class="acf-table-add-col ' + t.param.classes.btn_small + ' ' + t.param.classes.btn_add_col + '"></a>',
				remove_col:		'<a href="#" class="acf-table-remove-col ' + t.param.classes.btn_small + ' ' + t.param.classes.btn_remove_row + '"></a>',
			};

		// }

		t.param.htmltable = {

			body_row:	   '<tr class="acf-table-body-row">' +
								'<td class="acf-table-body-left">' +
									t.param.htmlbuttons.add_row +
									'<div class="acf-table-body-cont"><!--ph--></div>' +
								'</td>' +
								'<td class="acf-table-body-right">' +
									t.param.htmlbuttons.remove_row +
								'</td>' +
							'</tr>',

			top_cell:	   '<td class="acf-table-top-cell" data-colparam="">' +
								t.param.htmlbuttons.add_col +
								'<div class="acf-table-top-cont"><!--ph--></div>' +
							'</td>',

			header_cell:	'<td class="acf-table-header-cell">' +
								'<div class="acf-table-header-cont"><!--ph--></div>' +
							'</td>',

			body_cell:	  '<td class="acf-table-body-cell">' +
								'<div class="acf-table-body-cont"><!--ph--></div>' +
							'</td>',

			bottom_cell:	'<td class="acf-table-bottom-cell">' +
								t.param.htmlbuttons.remove_col +
							'</td>',

			table:		   '<div class="acf-table-wrap">' +
								'<table class="acf-table-table">' + //  acf-table-hide-header acf-table-hide-left acf-table-hide-top
									'<tr class="acf-table-top-row">' +
										'<td class="acf-table-top-left">' +
											t.param.htmlbuttons.add_col +
										'</td>' +
										'<td class="acf-table-top-right"></td>' +
									'</tr>' +
									'<tr class="acf-table-header-row acf-table-header-hide-off">' +
										'<td class="acf-table-header-left">' +
											t.param.htmlbuttons.add_row +
										'</td>' +
										'<td class="acf-table-header-right"></td>' +
									'</tr>' +
									'<tr class="acf-table-bottom-row">' +
										'<td class="acf-table-bottom-left"></td>' +
										'<td class="acf-table-bottom-right"></td>' +
									'</tr>' +
								'</table>' +

							'</div>',
		};

		t.param.htmleditor =	'<div class="acf-table-cell-editor">' +
									'<textarea name="acf-table-cell-editor-textarea" class="acf-table-cell-editor-textarea"></textarea>' +
								'</div>';

		t.obj = {
			body: $( 'body' ),
		};

		t.var = {
			ajax: false,
		};

		t.tables = {};

		t.state = {
			'current_cell_obj': false,
			'cell_editor_cell': false,
			'cell_editor_last_keycode': false
		};

		t.init = function() {

			t.init_once();

			function isBlockEditor() {

				if (
					document.body &&
					document.body.classList.contains('block-editor-page')
				) {
					return true;
				}

				return false;
			}

			function waitForBlockEditorReady( callback ) {


				const check = () => {

					const id = wp.data.select('core/editor').getCurrentPostId();

					if ( id ) {

						callback();
					}
					else {

						requestAnimationFrame( check );
					}
				};

				check();
			}

			function addMutationObserver() {

				let raf = null;

				let mutationObserver = new MutationObserver( function( mutations ) {

					if ( raf ) {

						return;
					}

					raf = requestAnimationFrame(() => {

						raf = null;

						if ( $( '.acf-table-root' ).not( '.acf-table-rendered' ).length > 0 ) {

							t.update_tables();
						}
					});

				});

				mutationObserver.observe( document.body, {
					childList: true,
					subtree: true,
				});

			}

			if ( isBlockEditor() ) {

				waitForBlockEditorReady(() => {
					t.update_tables();
					addMutationObserver();
				});
			}
			else {

				acf.add_action('ready', function($el){

					requestAnimationFrame(() => {

						t.update_tables();
						addMutationObserver();
					});
				});
			}
		};

		t.update_tables = function() {

			t.each_table();
		};

		t.init_once = function() {

			t.table_remove_row();
			t.table_remove_col();
			t.table_add_col_event();
			t.table_add_row_event();
			t.sortable_event();
			t.cell_editor();
			t.cell_editor_tab_navigation();
			t.prevent_cell_links();
			//t.ui_event_ajax();
			t.ui_event_use_header();
			t.ui_event_caption();
			t.ui_event_change_location_rule();
		};

		t.ui_event_ajax = function() {

			$( document ).ajaxComplete( function( event ) {

				setTimeout( function() {

					t.each_table();

				}, 1 );
			});
		}

		t.ui_event_change_location_rule = function() {

			t.obj.body.on( 'change', '[name="post_category[]"], [name="post_format"], [name="page_template"], [name="parent_id"], [name="role"], [name^="tax_input"]', function() {

				var interval = setInterval( function() {

					var table_fields = $( '.field_type-table' );

					if ( table_fields.length > 0 ) {

						t.each_table();

						clearInterval( interval );
					}

				}, 100 );

			} );

		};

		t.get_field_key = function( that ) {

			// DETECT BLOCK, GETS BLOCK ID {

				var block_id = '';

				$wp_block = that.closest( '.wp-block' );

				if ( $wp_block.length > 0 ) {

					var block_id = $wp_block.attr( 'id' );
				}

			// }

			var target = that.closest( '[data-key^="field_"]' );

			if ( target.length > 0 ) {

				return block_id + ':' + target.data( 'key' );
			}

			return false;
		};

		t.each_table = function( ) {

			$( '.acf-field-table .acf-table-root' ).not( '.acf-table-rendered' ).each( function() {

				t.render_table( $( this ) );
			} );
		};

		t.render_table = function( $el ) {

			var p = {};

			p.obj_root =  $el;

			var that = p.obj_root,
				field_key = t.get_field_key( that ),
				table = p.obj_root.find( '.acf-table-wrap' );

			// ADDS TABLE OBJECT {

				t.tables[ field_key ] = p;

			// }

			if ( table.length > 0 ) {

				return;
			}

			p.obj_root.addClass( 'acf-table-rendered' );

			t.data_get( p );

			t.data_default( p );

			t.field_options_get( p );

			t.table_render( p );

			t.misc_render( p );

			if ( typeof p.data.b[ 1 ] === 'undefined' && typeof p.data.b[ 0 ][ 1 ] === 'undefined' && p.data.b[ 0 ][ 0 ].c === '' ) {

				p.obj_root.find( '.acf-table-remove-col' ).hide(),
				p.obj_root.find( '.acf-table-remove-row' ).hide();
			}
		}

		t.field_options_get = function( p ) {

			try {

				p.field_options = JSON.parse( decodeURIComponent( p.obj_root.find( '[data-field-options]' ).data( 'field-options' ) ) );
			}
			catch (e) {

				p.field_options = {
					use_header: 2
				};

				console.log( 'The tablefield options value is not a valid JSON string:', decodeURIComponent( p.obj_root.find( '[data-field-options]' ).data( 'field-options' ) ) );
				console.log( 'The parsing error:', e );
			}

		};

		t.ui_event_use_header = function() {

			// HEADER: SELECT FIELD ACTIONS {

				t.obj.body.on( 'change', '.acf-table-fc-opt-use-header', function() {

					var that = $( this ),
						p = {};

					p.obj_root = that.closest( '.acf-table-root' );
					p.obj_table = p.obj_root.find( '.acf-table-table' );

					t.data_get( p );

					t.data_default( p );

					if ( that.val() === '1' ) {

						p.obj_table.removeClass( 'acf-table-hide-header' );

						p.data.p.o.uh = 1;
						t.update_table_data_field( p );
					}
					else {

						p.obj_table.addClass( 'acf-table-hide-header' );

						p.data.p.o.uh = 0;
						t.update_table_data_field( p );
					}

				} );

			// }
		};

		t.ui_event_caption = function() {

			// CAPTION: INPUT FIELD ACTIONS {

				t.obj.body.on( 'change', '.acf-table-fc-opt-caption', function() {

					var that = $( this );
					t.caption_update( that );
				} );

				var interval;

				t.obj.body.on( 'keyup', '.acf-table-fc-opt-caption', function() {

					clearInterval( interval );
					var that = $( this );

					interval = setInterval( function() {

						t.caption_update( that );
						clearInterval( interval );
					}, 300 );

				} );

			// }
		};

		t.caption_update = function( that ) {

			p = {};

			p.obj_root = that.closest( '.acf-table-root' );
			p.obj_table = p.obj_root.find( '.acf-table-table' );

			t.data_get( p );
			t.data_default( p );

			p.data.p.ca = t.sanitizeHtml( that.val() );
			t.update_table_data_field( p );
		};

		t.data_get = function( p ) {

			// DATA FROM FIELD {

				var val = p.obj_root.find( 'input.table' ).val();

				p.data = false;

				// CHECK FIELD CONTEXT {

					if ( p.obj_root.closest( '.acf-fields' ).hasClass( 'acf-block-fields' ) ) {

						p.field_context = 'block';
					}
					else {

						p.field_context = 'box';
					}

				// }

				if ( val !== '' ) {

					try {

						if ( p.field_context === 'box' ) {

							p.data = JSON.parse( decodeURIComponent( val.replace(/\+/g, '%20') ) );
						}

						if ( p.field_context === 'block' ) {

							p.data = JSON.parse( decodeURIComponent( val.replace(/\+/g, '%20') ) );
						}
					}
					catch (e) {

						if ( p.field_context === 'box' ) {

							console.log( 'The parsing error:', e );
							console.log( 'The tablefield value is not a valid JSON string:', decodeURIComponent( val.replace(/\+/g, '%20') ) );
						}

						if ( p.field_context === 'block' ) {

							console.log( 'The parsing error:', e );
							console.log( 'The tablefield value is not a valid JSON string:', decodeURIComponent( val.replace(/\+/g, '%20') ) );
						}
					}

					if ( typeof p.data.p != 'object' ) {

						console.log( 'The tablefield value is not a tablefield JSON string:', p.data );

						p.data = false;
					}
				}

				return p.data;

			// }

		};

		t.data_default = function( p ) {

			// DEFINES DEFAULT TABLE DATA {

				p.data_defaults = {

					acftf: {
						v: t.version,
					},

					p: {
						o: {
							uh: 0, // use header
						},
						ca: '', // caption content
					},

					// from data-colparam

					c: [
						{
							p: {},
						},
					],

					// header

					h: [
						{
							c: '',
						},
					],

					// body

					b: [
						[
							{
								c: '',
							},
						],
					],
				};

			// }

			// ADDS MISSING DATA OR DATA SECTIONS FROM DEFAULT {

				if ( p.data ) {

					if ( typeof p.data.c !== 'object' ) {

						p.data.c = p.data_defaults.c;
					}

					if ( typeof p.data.h !== 'object' ) {

						p.data.b = p.data_defaults.h;
					}

					if ( typeof p.data.b !== 'object' ) {

						p.data.b = p.data_defaults.b;
					}

					if ( typeof p.data.p !== 'object' ) {

						p.data.p = p.data_defaults.p;
					}

					if ( typeof p.data.acftf !== 'object' ) {

						p.data.acftf === p.data_defaults.acftf;
					}

				}
				else {

					p.data = p.data_defaults;
				}

			// }

			// MERGES MISSING SECTION PARAMETERS FROM DEFAULTS {

				p.data.acftf = $.extend( true, p.data_defaults.acftf, p.data.acftf );
				p.data.p = $.extend( true, p.data_defaults.p, p.data.p );

			// }
		};

		t.table_render = function( p ) {

			let build_table_json = false;

			// TABLE HTML MAIN {

				p.obj_root.find( '.acf-table-wrap' ).remove();
				p.obj_root.append( t.param.htmltable.table );

			// }

			// TABLE GET OBJECTS {

				p.obj_table = p.obj_root.find( '.acf-table-table' );
				p.obj_top_row = p.obj_root.find( '.acf-table-top-row' ),
				p.obj_top_insert = p.obj_top_row.find( '.acf-table-top-right' ),
				p.obj_header_row = p.obj_root.find( '.acf-table-header-row' ),
				p.obj_header_insert = p.obj_header_row.find( '.acf-table-header-right' ),
				p.obj_bottom_row = p.obj_root.find( '.acf-table-bottom-row' ),
				p.obj_bottom_insert = p.obj_bottom_row.find( '.acf-table-bottom-right' );

			// }

			// CHECK FOR EQUAL COLUMNS IN COLUMNS DATA AND FIRST BODY ROW DATA {

				if (
					p.data.c &&
					p.data.b &&
					p.data.c.length < p.data.b[0].length
				 ) {

					build_table_json = true;

					let length =  p.data.b[0].length;

					for ( let index = 0; index < length; index++ ) {

						p.data.c[ index ] = { o: {} };
					}
				}

				let cols = p.data.c.length;

			// }

			// TOP CELLS {

				// INSERT TOP CELLS {

					if ( p.data.c ) {

						for ( i in p.data.c ) {

							p.obj_top_insert.before( t.param.htmltable.top_cell );
						}
					}

					t.table_top_labels( p );

				// }

			// }

			// HEADER CELLS {

				if ( p.data.h ) {

					for ( i in p.data.h ) {

						// PREVENTS TO MANY CELLS {

							if ( cols <= i ) {

								build_table_json = true;
								break;
							}

						// }

						p.data.h[ i ].c = t.sanitizeHtml( p.data.h[ i ].c );

						p.obj_header_insert.before( t.param.htmltable.header_cell.replace( '<!--ph-->', p.data.h[ i ].c ) );
					}

					// ADDS MISSING CELLS {

						let existing_cells = i + 1;

						if ( cols > existing_cells  ) {

							for ( let add_i = 0; add_i < (cols - existing_cells); add_i++ ) {

								p.obj_header_insert.before( t.param.htmltable.header_cell.replace( '<!--ph-->', '' ) );
							}

							build_table_json = true;
						}

					// }
				}

			// }

			// BODY ROWS {

				if ( p.data.b ) {

					for ( i in p.data.b ) {

						p.obj_bottom_row.before( t.param.htmltable.body_row.replace( '<!--ph-->', parseInt(i) + 1 ) );
					}
				}

			// }

			// BODY ROWS CELLS {

				var body_rows = p.obj_root.find( '.acf-table-body-row'),
					row_i = 0;

				if ( body_rows ) {

					body_rows.each( function() {

						var body_row = $( this ),
							row_insert = body_row.find( '.acf-table-body-right' );

						for( i in p.data.b[ row_i ] ) {

							i = parseInt( i );

							// PREVENTS TO MANY CELLS {

								if ( cols <= i ) {

									build_table_json = true;
									break;
								}

							// }

							p.data.b[ row_i ][ i ].c = t.sanitizeHtml( p.data.b[ row_i ][ i ].c );

							row_insert.before( t.param.htmltable.body_cell.replace( '<!--ph-->', p.data.b[ row_i ][ i ].c ) );
						}

						// ADDS MISSING CELLS {

							let existing_cells = i + 1;

							if ( cols > existing_cells  ) {

								for ( let add_i = 0; add_i < (cols - existing_cells); add_i++ ) {

									row_insert.before( t.param.htmltable.body_cell.replace( '<!--ph-->', '' ) );
								}

								build_table_json = true;
							}

						// }

						row_i = row_i + 1;
					} );
				}

			// }

			// TABLE BOTTOM {

				if ( p.data.c ) {

					for ( i in p.data.c ) {

						p.obj_bottom_insert.before( t.param.htmltable.bottom_cell );
					}
				}

			// }

			// BUILD TABLE JSON {

				if ( true === build_table_json ) {

					t.table_build_json( p );
				}

			// }

		};

		t.misc_render = function( p ) {

			t.init_option_use_header( p );
			t.init_option_caption( p );
		};

		t.init_option_use_header = function( p ) {

			// VARS {

				var v = {};

				v.obj_use_header = p.obj_root.find( '.acf-table-fc-opt-use-header' );

			// }

			// HEADER {

				// HEADER: FIELD OPTIONS, THAT AFFECTS DATA {

					// HEADER IS NOT ALLOWED

					if (
						p.field_options.use_header === 2 &&
						p.data.p.o.uh !== 0
					) {

						p.obj_table.addClass( 'acf-table-hide-header' );

						p.data.p.o.uh = 0;
						t.update_table_data_field( p );
					}

					// HEADER IS REQUIRED

					if (
						p.field_options.use_header === 1 &&
						p.data.p.o.uh !== 1
					) {

						p.data.p.o.uh = 1;
						t.update_table_data_field( p );
					}

				// }

				// HEADER: SET CHECKBOX STATUS {

					if ( p.data.p.o.uh === 1 ) {

						v.obj_use_header.val( '1' );
					}

					if ( p.data.p.o.uh === 0 ) {

						v.obj_use_header.val( '0' );
					}

				// }

				// HEADER: SET HEADER VISIBILITY {

					if ( p.data.p.o.uh === 1 ) {

						p.obj_table.removeClass( 'acf-table-hide-header' );

					}

					if ( p.data.p.o.uh === 0 ) {

						p.obj_table.addClass( 'acf-table-hide-header' );
					}

				// }

			// }

		};

		t.init_option_caption = function( p ) {

			if (
				typeof p.field_options.use_caption !== 'number' ||
				p.field_options.use_caption === 2
			) {

				return;
			}

			// VARS {

				var v = {};

				v.obj_caption = p.obj_root.find( '.acf-table-fc-opt-caption' );

			// }

			// SET CAPTION VALUE {

				v.obj_caption.val( p.data.p.ca );

			// }

		};

		t.table_add_col_event = function() {

			t.obj.body.on( 'click', '.acf-table-add-col', function( e ) {

				e.preventDefault();

				var that = $( this ),
					p = {};

				p.obj_col = that.parent();

				t.table_add_col( p );

			} );
		};

		t.table_add_col = function( p ) {

				// requires
				// p.obj_col

				var that_index = p.obj_col.index();

				p.obj_root = p.obj_col.closest( '.acf-table-root' );
				p.obj_table = p.obj_root.find( '.acf-table-table' );

				$( p.obj_table.find( '.acf-table-top-row' ).children()[ that_index ] ).after( t.param.htmltable.top_cell.replace( '<!--ph-->', '' ) );

				$( p.obj_table.find( '.acf-table-header-row' ).children()[ that_index ] ).after( t.param.htmltable.header_cell.replace( '<!--ph-->', '' ) );

				p.obj_table.find( '.acf-table-body-row' ).each( function() {

					$( $( this ).children()[ that_index ] ).after( t.param.htmltable.body_cell.replace( '<!--ph-->', '' ) );
				} );

				$( p.obj_table.find( '.acf-table-bottom-row' ).children()[ that_index ] ).after( t.param.htmltable.bottom_cell.replace( '<!--ph-->', '' ) );

				t.table_top_labels( p );

				p.obj_table.find( '.acf-table-remove-col' ).show();
				p.obj_table.find( '.acf-table-remove-row' ).show();

				t.table_build_json( p );
		};

		t.table_remove_col = function() {

			t.obj.body.on( 'click', '.acf-table-remove-col', function( e ) {

				e.preventDefault();

				var p = {},
					that = $( this ),
					that_index = that.parent().index(),
					obj_rows = undefined,
					cols_count = false;

				p.obj_root = that.closest( '.acf-table-root' );
				p.obj_table = p.obj_root.find( '.acf-table-table' );
				p.obj_top = p.obj_root.find( '.acf-table-top-row' );
				obj_rows = p.obj_table.find( '.acf-table-body-row' );
				cols_count = p.obj_top.find( '.acf-table-top-cell' ).length;

				$( p.obj_table.find( '.acf-table-top-row' ).children()[ that_index ] ).remove();

				$( p.obj_table.find( '.acf-table-header-row' ).children()[ that_index ] ).remove();

				if ( cols_count == 1 ) {

					obj_rows.remove();

					t.table_add_col( {
						obj_col: p.obj_table.find( '.acf-table-top-left' )
					} );

					t.table_add_row( {
						obj_row: p.obj_table.find( '.acf-table-header-row' )
					} );

					p.obj_table.find( '.acf-table-remove-col' ).hide();
					p.obj_table.find( '.acf-table-remove-row' ).hide();
				}
				else {

					obj_rows.each( function() {

						$( $( this ).children()[ that_index ] ).remove();
					} );
				}

				$( p.obj_table.find( '.acf-table-bottom-row' ).children()[ that_index ] ).remove();

				t.table_top_labels( p );

				t.table_build_json( p );

			} );
		};

		t.table_add_row_event = function() {

			t.obj.body.on( 'click', '.acf-table-add-row', function( e ) {

				e.preventDefault();

				var that = $( this ),
					p = {};

				p.obj_row = that.parent().parent();

				t.table_add_row( p );
			});
		};

		t.table_add_row = function( p ) {

			// requires
			// p.obj_row

			var that_index = 0,
				col_amount = 0,
				body_cells_html = '';

			p.obj_root = p.obj_row.closest( '.acf-table-root' );
			p.obj_table = p.obj_root.find( '.acf-table-table' );
			p.obj_table_rows = p.obj_table.find( '.acf-table-body-row' );
			col_amount = p.obj_table.find( '.acf-table-top-cell' ).length;
			that_index = p.obj_table_rows.index(p.obj_row);

			if ( p.obj_row.hasClass('acf-table-header-row') ) {

				p.obj_table_rows = p.obj_table.find( '.acf-table-header-row' );
				that_index = 0;
			}

			for ( i = 0; i < col_amount; i++ ) {

				body_cells_html = body_cells_html + t.param.htmltable.body_cell.replace( '<!--ph-->', '' );
			}

			if ( that_index > -1 ) {

				$( p.obj_table_rows[ that_index ] )
					.after( t.param.htmltable.body_row )
					.next()
					.find('.acf-table-body-left')
					.after( body_cells_html );
			}
			else {

				$( p.obj_table_rows[ that_index + 1 ] )
					.before( t.param.htmltable.body_row )
					.prev()
					.find('.acf-table-body-left')
					.after( body_cells_html );
			}


			t.table_left_labels( p );

			p.obj_table.find( '.acf-table-remove-col' ).show();
			p.obj_table.find( '.acf-table-remove-row' ).show();

			t.table_build_json( p );

		};

		t.table_remove_row = function() {

			t.obj.body.on( 'click', '.acf-table-remove-row', function( e ) {

				e.preventDefault();

				var p = {},
					that = $( this ),
					rows_count = false;

				p.obj_root = that.closest( '.acf-table-root' );
				p.obj_table = p.obj_root.find( '.acf-table-table' );
				p.obj_rows = p.obj_root.find( '.acf-table-body-row' );

				rows_count = p.obj_rows.length;

				that.parent().parent().remove();

				if ( rows_count == 1 ) {

					t.table_add_row( {
						obj_row: p.obj_table.find( '.acf-table-header-row' )
					} );

					p.obj_table.find( '.acf-table-remove-row' ).hide();
				}

				t.table_left_labels( p );

				t.table_build_json( p );

			} );
		};

		t.table_top_labels = function( p ) {

			var letter_i_1 = 'A'.charCodeAt( 0 ),
				letter_i_2 = 'A'.charCodeAt( 0 ),
				use_2 = false;

			p.obj_table.find( '.acf-table-top-cont' ).each( function() {

				var string = '';

				if ( !use_2 ) {

					string = String.fromCharCode( letter_i_1 );

					if ( letter_i_1 === 'Z'.charCodeAt( 0 ) ) {

						letter_i_1 = 'A'.charCodeAt( 0 );
						use_2 = true;
					}
					else {

						letter_i_1 = letter_i_1 + 1;
					}
				}
				else {

					string = String.fromCharCode( letter_i_1 ) + String.fromCharCode( letter_i_2 );

					if ( letter_i_2  === 'Z'.charCodeAt( 0 ) ) {

						letter_i_1 = letter_i_1 + 1;
						letter_i_2 = 'A'.charCodeAt( 0 );
					}
					else {

						letter_i_2 = letter_i_2 + 1;
					}
				}

				$( this ).text( string );

			} );
		};

		t.table_left_labels = function( p ) {

			var i = 0;

			p.obj_table.find( '.acf-table-body-left' ).each( function() {

				i = i + 1;

				$( this ).find( '.acf-table-body-cont' ).text( i );

			} );
		};

		t.table_build_json = function( p ) {

			var i = 0,
				i2 = 0,
				rerender_table = false;

			p.data = t.data_get( p );
			t.data_default( p );

			p.data.c = [];
			p.data.h = [];
			p.data.b = [];

			// TOP {

				i = 0;

				p.obj_table.find( '.acf-table-top-cont' ).each( function() {

					p.data.c[ i ] = {};
					p.data.c[ i ].p = $( this ).parent().data( 'colparam' );

					i = i + 1;
				} );

				let cols = p.data.c.length;

			// }

			// HEADER {

				i = 0;

				p.obj_table.find( '.acf-table-header-cont' ).each( function() {

					// PREVENTS TO MANY CELLS {

						if ( cols <= i ) {

							rerender_table = true;
							return;
						}

					// }

					p.data.h[ i ] = {};
					p.data.h[ i ].c = $( this ).html();

					i = i + 1;
				} );

				// ADDS MISSING CELLS {

					let existing_cells = i;

					if ( cols > existing_cells  ) {

						for ( let add_i = 0; add_i < (cols - existing_cells); add_i++ ) {

							let new_i = p.data.h.length;
							p.data.h[ new_i ] = {};
							p.data.h[ new_i ].c = '';
							rerender_table = true;
						}
					}

				// }

			// }

			// BODY {

				i = 0;
				i2 = 0;

				p.obj_table.find( '.acf-table-body-row' ).each( function() {

					p.data.b[ i ] = [];

					$( this ).find( '.acf-table-body-cell .acf-table-body-cont' ).each( function() {

						// PREVENTS TO MANY CELLS {

							if ( cols <= i2 ) {

								rerender_table = true;
								return;
							}

						// }

						p.data.b[ i ][ i2 ] = {};
						p.data.b[ i ][ i2 ].c = $( this ).html();

						i2 = i2 + 1;
					} );

					// ADDS MISSING CELLS {

						let existing_cells = i2;

						if ( cols > existing_cells  ) {

							for ( let add_i = 0; add_i < (cols - existing_cells); add_i++ ) {

								let new_i = p.data.b[ i ].length;
								p.data.b[ i ][ new_i ] = {};
								p.data.b[ i ][ new_i ].c = '';
								rerender_table = true;
							}
						}

					// }

					i2 = 0;
					i = i + 1;
				} );

			// }

			// UPDATE INPUT WITH NEW DATA {

				t.update_table_data_field( p );

			// }

			// RERENDER TABLE (DATA REPAIR OCCURED) {

				if ( true === rerender_table ) {

					t.table_render( p );
				}

			// }

		};

		t.update_table_data_field = function( p ) {

			// UPDATE INPUT WITH NEW DATA {

				p.data = t.update_table_data_version( p.data );

				// makes json string from data object
				var data = JSON.stringify( p.data );

				// adds backslash to all \" in JSON string because encodeURIComponent() strippes backslashes
				data.replace( /\\"/g, '\\"' );

				// encodes the JSON string to URI component, the format, the JSON string is saved to the database
				data = encodeURIComponent( data )

				p.obj_root.find( 'input.table' ).val( data );

				t.field_changed( p );

			// }
		};

		t.update_table_data_version = function( data ) {

			if ( typeof data.acftf === 'undefined' ) {

				data.acftf = {};
			}

			data.acftf.v = t.version;

			return data;
		}

		t.cell_editor = function() {

			t.obj.body.on( 'click', '.acf-table-body-cell, .acf-table-header-cell', function( e ) {

				e.stopImmediatePropagation();

				t.cell_editor_save();

				var that = $( this );

				t.cell_editor_add_editor({
					'that': that
				});

			} );

			t.obj.body.on( 'click', '.acf-table-cell-editor-textarea', function( e ) {

				e.stopImmediatePropagation();
			} );

			t.obj.body.on( 'click', function( e ) {

				t.cell_editor_save();
			} );

			t.cell_editor_update_event();
		};

		t.cell_editor_add_editor = function( p ) {

			var defaults = {
				'that': false
			};

			p = $.extend( true, defaults, p );

			if ( p['that'] ) {

				var that_val = p['that'].find( '.acf-table-body-cont, .acf-table-header-cont' ).html();

				t.state.current_cell_obj = p['that'];
				t.state.cell_editor_is_open = true;

				that_val = t.sanitizeHtml( that_val );

				let $textarea = p['that'].prepend( t.param.htmleditor ).find( '.acf-table-cell-editor-textarea' );
				$textarea.html( that_val );
				$textarea.css( 'min-height', p['that'].height() + 'px' );
				$textarea.focus();
				$textarea[0].selectionStart = $textarea[0].selectionEnd = 10000;
			}
		};

		t.get_next_table_cell = function( p ) {

			var defaults = {
				'key': false
			};

			p = $.extend( true, defaults, p );

			// next cell of current row
			var next_cell = t.state.current_cell_obj
								.next( '.acf-table-body-cell, .acf-table-header-cell' );

			// else if get next row
			if ( next_cell.length === 0 ) {

				next_cell = t.state.current_cell_obj
					.parent()
					.next( '.acf-table-body-row' )
					.find( '.acf-table-body-cell')
					.first();
			}

			// if next row, get first cell of that row
			if ( next_cell.length !== 0 ) {

				t.state.current_cell_obj = next_cell;
			}
			else {

				t.state.current_cell_obj = false;
			}
		};

		t.get_prev_table_cell = function( p ) {

			var defaults = {
				'key': false
			};

			p = $.extend( true, defaults, p );

			// prev cell of current row
			var table_obj = t.state.current_cell_obj.closest( '.acf-table-table' ),
				no_header = table_obj.hasClass( 'acf-table-hide-header' );
				prev_cell = t.state.current_cell_obj
								.prev( '.acf-table-body-cell, .acf-table-header-cell' );

			// else if get prev row
			if ( prev_cell.length === 0 ) {

				var row_selectors = [ '.acf-table-body-row' ];

				// prevents going to header cell if table header is hidden
				if ( no_header === false ) {

					row_selectors.push( '.acf-table-header-row' );
				}

				prev_cell = t.state.current_cell_obj
					.parent()
					.prev( row_selectors.join( ',' ) )
					.find( '.acf-table-body-cell, .acf-table-header-cell' )
					.last();
			}

			// if next row, get first cell of that row
			if ( prev_cell.length !== 0 ) {

				t.state.current_cell_obj = prev_cell;
			}
			else {

				t.state.current_cell_obj = false;
			}
		};

		t.cell_editor_update_event = function() {

			var interval;

			t.obj.body.on( 'keyup', '.acf-table-cell-editor-textarea', function() {

				clearInterval( interval );

				interval = setInterval( function() {

					t.cell_editor_update();
					clearInterval( interval );
				}, 300 );
			} );

		};

		t.cell_editor_update = function() {

			var cell_editor = t.obj.body.find( '.acf-table-cell-editor' ),
				cell_editor_textarea = cell_editor.find( '.acf-table-cell-editor-textarea' ),
				p = {},
				cell_editor_val = '';

			if ( typeof cell_editor_textarea.val() !== 'undefined' ) {

				p.obj_root = cell_editor.closest( '.acf-table-root' );
				p.obj_table = p.obj_root.find( '.acf-table-table' );

				var cell_editor_val = cell_editor_textarea.val();

				// prevent XSS injection
				cell_editor_val = t.sanitizeHtml( cell_editor_val );

				cell_editor.next().html( cell_editor_val );

				t.table_build_json( p );
			}
		};

		t.cell_editor_save = function() {

			var cell_editor = t.obj.body.find( '.acf-table-cell-editor' ),
				cell_editor_textarea = cell_editor.find( '.acf-table-cell-editor-textarea' ),
				p = {},
				cell_editor_val = '';

			if ( typeof cell_editor_textarea.val() !== 'undefined' ) {

				p.obj_root = cell_editor.closest( '.acf-table-root' );
				p.obj_table = p.obj_root.find( '.acf-table-table' );

				var cell_editor_val = cell_editor_textarea.val();

				// prevent XSS injection
				cell_editor_val = t.sanitizeHtml( cell_editor_val );

				cell_editor.next().html( cell_editor_val );

				t.table_build_json( p );

				cell_editor.remove();
				t.state.cell_editor_is_open = false;

				p.obj_root.find( '.acf-table-remove-col' ).show(),
				p.obj_root.find( '.acf-table-remove-row' ).show();
			}
		};

		t.cell_editor_tab_navigation = function() {

			t.obj.body.on( 'keydown', '.acf-table-cell-editor', function( e ) {

				var keyCode = e.keyCode || e.which;

				if ( keyCode == 9 ) {

					e.preventDefault();

					t.cell_editor_save();

					if ( t.state.cell_editor_last_keycode === 16 ) {

						t.get_prev_table_cell();

					}
					else {

						t.get_next_table_cell();
					}

					t.cell_editor_add_editor({
						'that': t.state.current_cell_obj
					});
				}

				t.state.cell_editor_last_keycode = keyCode;

			});
		};

		t.prevent_cell_links = function() {

			t.obj.body.on( 'click', '.acf-table-body-cont a, .acf-table-header-cont a', function( e ) {

				e.preventDefault();
			} );
		};

		t.sortable_fix_width = function(e, ui) {

			ui.children().each( function() {

				var that = $( this );

				that.width( that.width() );

			} );

			return ui;
		};

		t.sortable_row = function( that ) {

			var param = {
				axis: 'y',
				items: '> tbody > .acf-table-body-row',
				containment: 'parent',
				handle: '.acf-table-body-left',
				helper: t.sortable_fix_width,
				update: function( event, ui ) {

					var p = {};

					p.obj_root = ui.item.closest( '.acf-table-root' );
					p.obj_table = p.obj_root.find( '.acf-table-table' );

					t.table_left_labels( p );
					t.table_build_json( p );
				},
			};

			that.sortable( param );

		};

		t.sortable_col = function( that ) {

			var p = {};

			p.start_index = 0;
			p.end_index = 0;

			var param = {
				axis: 'x',
				items: '> .acf-table-top-cell',
				containment: 'parent',
				helper: t.sortable_fix_width,
				start: function(event, ui) {

					p.start_index = ui.item.index();
				},
				update: function( event, ui ) {

					p.end_index = ui.item.index();

					p.obj_root = ui.item.closest( '.acf-table-root' );
					p.obj_table = p.obj_root.find( '.acf-table-table' );

					t.table_top_labels( p );
					t.sort_cols( p );
					t.table_build_json( p );
				},
			};

			that.find( '.acf-table-top-row' ).sortable( param );
		};

		t.sortable_event = function() {

			t.obj.body.on( 'mouseenter', '.acf-table-table:not(.sortable-initialized)', function() {

				var that = $( this );

				t.sortable_row( that );
				t.sortable_col( that );

				that.addClass( 'sortable-initialized' );

			} );

		};

		t.field_changed = function( p ) {

			setTimeout( function() {

				p.obj_root.trigger( 'change' );
			}, 0 );
		};

		t.sort_cols = function( p ) {

			p.obj_table.find('.acf-table-header-row').each( function() {

				p.header_row = $(this),
				p.header_row_children = p.header_row.children();

				if ( p.end_index < p.start_index ) {

					$( p.header_row_children[ p.end_index ] ).before( $( p.header_row_children[ p.start_index ] ) );
				}

				if ( p.end_index > p.start_index ) {

					$( p.header_row_children[ p.end_index ] ).after( $( p.header_row_children[ p.start_index ] ) );
				}

			} );

			p.obj_table.find('.acf-table-body-row').each( function() {

				p.body_row = $(this),
				p.body_row_children = p.body_row.children();

				if ( p.end_index < p.start_index ) {

					$( p.body_row_children[ p.end_index ] ).before( $( p.body_row_children[ p.start_index ] ) );
				}

				if ( p.end_index > p.start_index ) {

					$( p.body_row_children[ p.end_index ] ).after( $( p.body_row_children[ p.start_index ] ) );
				}

			} );
		};

		t.helper = {

			getLength: function( o ) {

				var len = o.length ? --o.length : -1;

				for (var k in o) {

					len++;
				}

				return len;
			},
		};

		t.sanitizeHtml = function( string ) {

			let options = {
				USE_PROFILES: {
					html: true
				},
				ADD_ATTR: ['target'],
			};

			options = t.doFilter( 'core', 'sanitize_html', options );

			string = t.DOMPurify.sanitize( string, options );
			string = t.addNoopenerToHtmlString( string );

			return string;
		};

		t.addNoopenerToHtmlString = function (html) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");

			doc.querySelectorAll('a[target="_blank"]').forEach(link => {
				const rel = link.getAttribute('rel');

				if (!rel) {
					link.setAttribute('rel', 'noopener');
				} else if (!rel.split(/\s+/).includes('noopener')) {
					link.setAttribute('rel', rel + ' noopener');
				}
			});

			return doc.body.innerHTML;
		}

		t.DOMPurify = (function () {

			/* This plugin uses its own embedded DOMPurify script to avoid
			conflicts with other DOMPurify integrations via wp_enqueue_script().
			This could result in an outdated version of DOMPurify being preferred. */

			return (function () {
				/*! @license DOMPurify 3.4.18 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.18/LICENSE */

				/* Copied substring without UMD-Wrapper from https://github.com/cure53/DOMPurify/blob/main/dist/purify.min.js */
				"use strict";function e(e,t){this.v=e,this.k=t}function t(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=Array(t);n<t;n++)r[n]=e[n];return r}function n(e){if(Array.isArray(e))return e}function r(e,t){var n=e==null?null:typeof Symbol<`u`&&e[Symbol.iterator]||e[`@@iterator`];if(n!=null){var r,i,a,o,s=[],c=!0,l=!1;try{if(a=(n=n.call(e)).next,t===0){if(Object(n)!==n)return;c=!1}else for(;!(c=(r=a.call(n)).done)&&(s.push(r.value),s.length!==t);c=!0);}catch(e){l=!0,i=e}finally{try{if(!c&&n.return!=null&&(o=n.return(),Object(o)!==o))return}finally{if(l)throw i}}return s}}function i(){throw TypeError(`Invalid attempt to destructure non-iterable instance. In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}
				/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
				function a(e,t){return n(e)||r(e,t)||o(e,t)||i()}function o(e,n){if(e){if(typeof e==`string`)return t(e,n);var r={}.toString.call(e).slice(8,-1);return r===`Object`&&e.constructor&&(r=e.constructor.name),r===`Map`||r===`Set`?Array.from(e):r===`Arguments`||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?t(e,n):void 0}}function s(t){var n,r;function i(n,r){try{var o=t[n](r),s=o.value,c=s instanceof e;Promise.resolve(c?s.v:s).then(function(e){if(c){var r=n===`return`&&s.k?n:`next`;if(!s.k||e.done)return i(r,e);e=t[r](e).value}a(!!o.done,e)},function(e){i(`throw`,e)})}catch(e){a(2,e)}}function a(e,t){e===2?n.reject(t):n.resolve({value:t,done:e}),(n=n.next)?i(n.key,n.arg):r=null}this._invoke=function(e,t){return new Promise(function(a,o){var s={key:e,arg:t,resolve:a,reject:o,next:null};r?r=r.next=s:(n=r=s,i(e,t))})},typeof t.return!=`function`&&(this.return=void 0)}s.prototype[typeof Symbol==`function`&&Symbol.asyncIterator||`@@asyncIterator`]=function(){return this},s.prototype.next=function(e){return this._invoke(`next`,e)},s.prototype.throw=function(e){return this._invoke(`throw`,e)},s.prototype.return=function(e){return this._invoke(`return`,e)};let c=Object.entries,l=Object.keys,u=Object.setPrototypeOf,d=Object.isFrozen,f=Object.getPrototypeOf,p=Object.getOwnPropertyDescriptor,m=Object.freeze,h=Object.seal,g=Object.create,ee=typeof Reflect<`u`&&Reflect,te=ee.apply,ne=ee.construct;m||(m=function(e){return e}),h||(h=function(e){return e}),te||(te=function(e,t){var n=[...arguments].slice(2);return e.apply(t,n)}),ne||(ne=function(e){return new e(...[...arguments].slice(1))});let _=D(Array.prototype.forEach),re=D(Array.prototype.lastIndexOf),ie=D(Array.prototype.pop),ae=D(Array.prototype.push),oe=D(Array.prototype.slice),se=D(Array.prototype.splice),v=Array.isArray,ce=O(Set),le=D(Set.prototype.add),ue=D(Set.prototype.has),y=D(String.prototype.toLowerCase),de=D(String.prototype.toString),fe=D(String.prototype.match),pe=D(String.prototype.replace),me=D(String.prototype.indexOf),he=D(String.prototype.trim),b=D(Number.prototype.toString),x=D(Boolean.prototype.toString),ge=typeof BigInt>`u`?null:D(BigInt.prototype.toString),_e=typeof Symbol>`u`?null:D(Symbol.prototype.toString),S=D(Object.prototype.hasOwnProperty),C=D(Object.prototype.toString),w=RegExp.prototype.test,T=function(e,t){return e instanceof RegExp&&(e.lastIndex=0),te(w,e,[t])},E=O(TypeError);function D(e){return function(t){var n=[...arguments].slice(1);return te(e,t,n)}}function O(e){return function(){return ne(e,[...arguments])}}function k(e,t){let n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:y;if(u&&u(e,null),!v(t))return e;let r=t.length;for(;r--;){let i=t[r];if(typeof i==`string`){let e=n(i);e!==i&&(d(t)||(t[r]=e),i=e)}e[i]=!0}return e}function A(e){for(let t=0;t<e.length;t++)S(e,t)||(e[t]=null);return e}function ve(e){let t=g(null);for(let r of c(e)){var n=a(r,2);let i=n[0],o=n[1];S(e,i)&&(t[i]=v(o)?A(o):o&&typeof o==`object`&&o.constructor===Object?ve(o):o)}return t}function ye(e){let t=g(null),n=l(e),r=n.length;for(;r--;)t[n[r]]=e[n[r]];return t}function be(e){switch(typeof e){case`string`:return e;case`number`:return b(e);case`boolean`:return x(e);case`bigint`:return ge?ge(e):`0`;case`symbol`:return _e?_e(e):`Symbol()`;case`undefined`:return C(e);case`function`:case`object`:{if(e===null)return C(e);let t=e,n=j(t,`toString`);if(typeof n==`function`){let e=n(t);return typeof e==`string`?e:C(e)}return C(e)}default:return C(e)}}function j(e,t){for(;e!==null;){let n=p(e,t);if(n){if(n.get)return D(n.get);if(typeof n.value==`function`)return D(n.value)}e=f(e)}function n(){return null}return n}function xe(e,t){for(;e!==null;){let n=p(e,t);if(n)return n.get?D(n.get):null;e=f(e)}return null}function Se(e){if(!e)return!1;try{return T(e,``),!0}catch(e){return!1}}let Ce=m(/* @__PURE__ */ `a.abbr.acronym.address.area.article.aside.audio.b.bdi.bdo.big.blink.blockquote.body.br.button.canvas.caption.center.cite.code.col.colgroup.content.data.datalist.dd.decorator.del.details.dfn.dialog.dir.div.dl.dt.element.em.fieldset.figcaption.figure.font.footer.form.h1.h2.h3.h4.h5.h6.head.header.hgroup.hr.html.i.img.input.ins.kbd.label.legend.li.main.map.mark.marquee.menu.menuitem.meter.nav.nobr.ol.optgroup.option.output.p.picture.pre.progress.q.rp.rt.ruby.s.samp.search.section.select.shadow.slot.small.source.spacer.span.strike.strong.style.sub.summary.sup.table.tbody.td.template.textarea.tfoot.th.thead.time.tr.track.tt.u.ul.var.video.wbr`.split(`.`)),we=m(/* @__PURE__ */ `svg.a.altglyph.altglyphdef.altglyphitem.animatecolor.animatemotion.animatetransform.circle.clippath.defs.desc.ellipse.filter.font.g.glyph.glyphref.hkern.image.line.lineargradient.marker.mask.metadata.mpath.path.pattern.polygon.polyline.radialgradient.rect.stop.style.switch.symbol.text.textpath.title.tref.tspan.view.vkern`.split(`.`)),Te=m([`feBlend`,`feColorMatrix`,`feComponentTransfer`,`feComposite`,`feConvolveMatrix`,`feDiffuseLighting`,`feDisplacementMap`,`feDistantLight`,`feDropShadow`,`feFlood`,`feFuncA`,`feFuncB`,`feFuncG`,`feFuncR`,`feGaussianBlur`,`feImage`,`feMerge`,`feMergeNode`,`feMorphology`,`feOffset`,`fePointLight`,`feSpecularLighting`,`feSpotLight`,`feTile`,`feTurbulence`]),Ee=m([`animate`,`color-profile`,`cursor`,`discard`,`font-face`,`font-face-format`,`font-face-name`,`font-face-src`,`font-face-uri`,`foreignobject`,`hatch`,`hatchpath`,`mesh`,`meshgradient`,`meshpatch`,`meshrow`,`missing-glyph`,`script`,`set`,`solidcolor`,`unknown`,`use`]),De=m(/* @__PURE__ */ `math.menclose.merror.mfenced.mfrac.mglyph.mi.mlabeledtr.mmultiscripts.mn.mo.mover.mpadded.mphantom.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msup.msubsup.mtable.mtd.mtext.mtr.munder.munderover.mprescripts`.split(`.`)),Oe=m([`maction`,`maligngroup`,`malignmark`,`mlongdiv`,`mscarries`,`mscarry`,`msgroup`,`mstack`,`msline`,`msrow`,`semantics`,`annotation`,`annotation-xml`,`mprescripts`,`none`]),ke=m([`#text`]),Ae=m(/* @__PURE__ */ `accept.action.align.alt.autocapitalize.autocomplete.autopictureinpicture.autoplay.background.bgcolor.border.capture.cellpadding.cellspacing.checked.cite.class.clear.color.cols.colspan.command.commandfor.controls.controlslist.coords.crossorigin.datetime.decoding.default.dir.disabled.disablepictureinpicture.disableremoteplayback.download.draggable.enctype.enterkeyhint.exportparts.face.for.headers.height.hidden.high.href.hreflang.id.inert.inputmode.integrity.ismap.kind.label.lang.list.loading.loop.low.max.maxlength.media.method.min.minlength.multiple.muted.name.nonce.noshade.novalidate.nowrap.open.optimum.part.pattern.placeholder.playsinline.popover.popovertarget.popovertargetaction.poster.preload.pubdate.radiogroup.readonly.rel.required.rev.reversed.role.rows.rowspan.spellcheck.scope.selected.shape.size.sizes.slot.span.srclang.start.src.srcset.step.style.summary.tabindex.title.translate.type.usemap.valign.value.width.wrap.xmlns`.split(`.`)),je=m(/* @__PURE__ */ `accent-height.accumulate.additive.alignment-baseline.amplitude.ascent.attributename.attributetype.azimuth.basefrequency.baseline-shift.begin.bias.by.class.clip.clippathunits.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-profile.color-rendering.cx.cy.d.dx.dy.diffuseconstant.direction.display.divisor.dominant-baseline.dur.edgemode.elevation.end.exponent.fill.fill-opacity.fill-rule.filter.filterunits.flood-color.flood-opacity.font-family.font-size.font-size-adjust.font-stretch.font-style.font-variant.font-weight.fx.fy.g1.g2.glyph-name.glyphref.gradientunits.gradienttransform.height.href.id.image-rendering.in.in2.intercept.k.k1.k2.k3.k4.kerning.keypoints.keysplines.keytimes.lang.lengthadjust.letter-spacing.kernelmatrix.kernelunitlength.lighting-color.local.marker-end.marker-mid.marker-start.markerheight.markerunits.markerwidth.maskcontentunits.maskunits.max.mask.mask-type.media.method.mode.min.name.numoctaves.offset.operator.opacity.order.orient.orientation.origin.overflow.paint-order.path.pathlength.patterncontentunits.patterntransform.patternunits.pointer-events.points.preservealpha.preserveaspectratio.primitiveunits.r.rx.ry.radius.refx.refy.repeatcount.repeatdur.restart.result.rotate.scale.seed.shape-rendering.slope.specularconstant.specularexponent.spreadmethod.startoffset.stddeviation.stitchtiles.stop-color.stop-opacity.stroke-dasharray.stroke-dashoffset.stroke-linecap.stroke-linejoin.stroke-miterlimit.stroke-opacity.stroke.stroke-width.style.surfacescale.systemlanguage.tabindex.tablevalues.targetx.targety.transform.transform-origin.text-anchor.text-decoration.text-orientation.text-rendering.textlength.type.u1.u2.unicode.values.vector-effect.viewbox.visibility.version.vert-adv-y.vert-origin-x.vert-origin-y.width.word-spacing.wrap.writing-mode.xchannelselector.ychannelselector.x.x1.x2.xmlns.y.y1.y2.z.zoomandpan`.split(`.`)),Me=m(/* @__PURE__ */ `accent.accentunder.align.bevelled.close.columnalign.columnlines.columnspacing.columnspan.denomalign.depth.dir.display.displaystyle.encoding.fence.frame.height.href.id.largeop.length.linethickness.lquote.lspace.mathbackground.mathcolor.mathsize.mathvariant.maxsize.minsize.movablelimits.notation.numalign.open.rowalign.rowlines.rowspacing.rowspan.rspace.rquote.scriptlevel.scriptminsize.scriptsizemultiplier.selection.separator.separators.stretchy.subscriptshift.supscriptshift.symmetric.voffset.width.xmlns`.split(`.`)),Ne=m([`xlink:href`,`xml:id`,`xlink:title`,`xml:space`,`xmlns:xlink`]),Pe=h(/{{[\w\W]*|^[\w\W]*}}/g),Fe=h(/<%[\w\W]*|^[\w\W]*%>/g),Ie=h(/\${[\w\W]*/g),Le=h(/{{|}}|\${|<%|%>|&lt;%|%&gt;/),Re=h(/^data-[\-\w.\u00B7-\uFFFF]+$/),ze=h(/^aria-[\-\w]+$/),Be=h(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),Ve=h(/^(?:\w+script|data):/i),He=h(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),Ue=h(/^html$/i),We=h(/^[a-z][.\w]*(-[.\w]+)+$/i),Ge=h(/<[/\w!]/g),Ke=h(/<[/\w]/g),qe=h(/<\/no(script|embed|frames)/i),Je=h(/\/>/i),Ye=h(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i),Xe=h(/^[\r\n\t ]+/),M={element:1,text:3,processingInstruction:7,comment:8,document:9,documentFragment:11},Ze=m(k({},[`style`,`script`,`xmp`,`iframe`,`noembed`,`noframes`,`plaintext`,`noscript`])),Qe=function(){return typeof window>`u`?null:window},$e=function(e,t){if(typeof e!=`object`||typeof e.createPolicy!=`function`)return null;let n=null,r=`data-tt-policy-suffix`;t&&t.hasAttribute(r)&&(n=t.getAttribute(r));let i=`dompurify`+(n?`#`+n:``);try{return e.createPolicy(i,{createHTML(e){return e},createScriptURL(e){return e}})}catch(e){return console.warn(`TrustedTypes policy `+i+` could not be created.`),null}},et=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}},N=function(e,t,n,r){return S(e,t)&&v(e[t])?k(r.base?ye(r.base):{},e[t],r.transform):n},tt=function(e,t,n){let r=S(e,t)?e[t]:void 0;return r&&typeof r==`object`?ve(r):n};function nt(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:Qe(),t=e=>nt(e);if(t.version=`3.4.18`,t.removed=[],!e||!e.document||e.document.nodeType!==M.document||!e.Element)return t.isSupported=!1,t;let n=e.document,r=n,i=r.currentScript,a=e.HTMLTemplateElement,o=e.Node,s=e.Element,l=e.NodeFilter,u=e.DOMParser,d=e.trustedTypes,f=s.prototype,p=j(f,`cloneNode`),ee=j(f,`remove`),te=j(f,`removeAttributeNode`),ne=j(f,`nextSibling`),b=j(f,`childNodes`),x=j(f,`parentNode`),ge=j(f,`shadowRoot`),_e=j(f,`attributes`),C=o&&o.prototype?j(o.prototype,`nodeType`):null,w=o&&o.prototype?j(o.prototype,`nodeName`):null,D=o&&o.prototype?j(o.prototype,`ownerDocument`):null,O=function(e){return C?C(e):e.nodeType},A=function(e){return w?w(e):e.nodeName},rt=xe(f,`namespaceURI`),it=function(e){return rt?rt(e):e.namespaceURI};if(typeof a==`function`){let e=n.createElement(`template`);e.content&&e.content.ownerDocument&&(n=e.content.ownerDocument)}let P,F=``,at,ot=!1,st=0,ct=function(){if(st>0)throw E(`A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.`)},lt=function(e){ct(),st++;try{return P.createHTML(e)}finally{st--}},ut=function(e){return P&&Vt?lt(e):e},dt=function(e){ct(),st++;try{return P.createScriptURL(e)}finally{st--}},ft=function(){return ot||(at=$e(d,i),ot=!0),at},pt=n,mt=pt.implementation,ht=pt.createNodeIterator,gt=pt.createDocumentFragment,_t=pt.getElementsByTagName,vt=r.importNode,I=et();t.isSupported=typeof c==`function`&&typeof x==`function`&&mt&&mt.createHTMLDocument!==void 0;let yt=Pe,bt=Fe,xt=Ie,St=Re,Ct=ze,wt=Ve,Tt=He,Et=We,Dt=Be,L=null,Ot=k({},[...Ce,...we,...Te,...De,...ke]),R=null,kt=k({},[...Ae,...je,...Me,...Ne]),z=null,At=null,jt=null,B=Object.seal(g(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}})),Mt=!0,Nt=!0,Pt=!1,Ft=!0,V=!1,H=!0,U=!1,It=!1,Lt=null,Rt=null,zt=!1,W=!1,Bt=!1,Vt=!1,Ht=!0,Ut=!1,Wt=`user-content-`,Gt=!0,Kt=!1,G=null,K=!1,q=null,qt=k({},/* @__PURE__ */ `annotation-xml.audio.colgroup.desc.foreignobject.head.iframe.math.mi.mn.mo.ms.mtext.noembed.noframes.noscript.plaintext.script.selectedcontent.style.svg.template.thead.title.video.xmp`.split(`.`)),Jt=null,Yt=k({},[`audio`,`video`,`img`,`source`,`image`,`track`]),Xt=null,Zt=k({},[`alt`,`class`,`for`,`id`,`label`,`name`,`pattern`,`placeholder`,`role`,`summary`,`title`,`value`,`style`,`xmlns`]),Qt=`http://www.w3.org/1998/Math/MathML`,$t=`http://www.w3.org/2000/svg`,J=`http://www.w3.org/1999/xhtml`,Y=J,en=!1,tn=null,nn=k({},[Qt,$t,J],de),rn=m(k({},[`mi`,`mo`,`mn`,`ms`,`mtext`])),an=null,on=m(k({},[`annotation-xml`])),sn=null,cn=m(g(null)),ln=k({},[`title`,`style`,`font`,`a`,`script`]),un=null,dn=[`application/xhtml+xml`,`text/html`],X=null,fn=null,pn=n.createElement(`form`),mn=function(e){return e instanceof RegExp||e instanceof Function},hn=function(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};e&&typeof e==`object`||(e={}),e=ve(e),un=dn.indexOf(e.PARSER_MEDIA_TYPE)===-1?`text/html`:e.PARSER_MEDIA_TYPE,X=un===`application/xhtml+xml`?de:y,L=N(e,`ALLOWED_TAGS`,Ot,{transform:X}),R=N(e,`ALLOWED_ATTR`,kt,{transform:X}),tn=N(e,`ALLOWED_NAMESPACES`,nn,{transform:de}),Xt=N(e,`ADD_URI_SAFE_ATTR`,Zt,{transform:X,base:Zt}),Jt=N(e,`ADD_DATA_URI_TAGS`,Yt,{transform:X,base:Yt}),q=N(e,`FORBID_CONTENTS`,qt,{transform:X}),At=N(e,`FORBID_TAGS`,g(null),{transform:X}),jt=N(e,`FORBID_ATTR`,g(null),{transform:X}),K=S(e,`USE_PROFILES`)?e.USE_PROFILES&&typeof e.USE_PROFILES==`object`?ve(e.USE_PROFILES):e.USE_PROFILES:!1,Mt=e.ALLOW_ARIA_ATTR!==!1,Nt=e.ALLOW_DATA_ATTR!==!1,Pt=e.ALLOW_UNKNOWN_PROTOCOLS||!1,Ft=e.ALLOW_SELF_CLOSE_IN_ATTR!==!1,V=e.SAFE_FOR_TEMPLATES||!1,H=e.SAFE_FOR_XML!==!1,U=e.WHOLE_DOCUMENT||!1,W=e.RETURN_DOM||!1,Bt=e.RETURN_DOM_FRAGMENT||!1,Vt=e.RETURN_TRUSTED_TYPE||!1,zt=e.FORCE_BODY||!1,Ht=e.SANITIZE_DOM!==!1,Ut=e.SANITIZE_NAMED_PROPS||!1,Gt=e.KEEP_CONTENT!==!1,Kt=e.IN_PLACE||!1,Dt=Se(e.ALLOWED_URI_REGEXP)?e.ALLOWED_URI_REGEXP:Be,Y=typeof e.NAMESPACE==`string`?e.NAMESPACE:J,an=tt(e,`MATHML_TEXT_INTEGRATION_POINTS`,rn),sn=tt(e,`HTML_INTEGRATION_POINTS`,on);let t=tt(e,`CUSTOM_ELEMENT_HANDLING`,cn);if(z=g(null),S(t,`tagNameCheck`)&&mn(t.tagNameCheck)&&(z.tagNameCheck=t.tagNameCheck),S(t,`attributeNameCheck`)&&mn(t.attributeNameCheck)&&(z.attributeNameCheck=t.attributeNameCheck),S(t,`allowCustomizedBuiltInElements`)&&typeof t.allowCustomizedBuiltInElements==`boolean`&&(z.allowCustomizedBuiltInElements=t.allowCustomizedBuiltInElements),h(z),V&&(Nt=!1),Bt&&(W=!0),K&&((S(e,`ALLOWED_TAGS`)||S(e,`ALLOWED_ATTR`))&&typeof console<`u`&&typeof console.warn==`function`&&console.warn(`DOMPurify: USE_PROFILES overrides ALLOWED_TAGS and ALLOWED_ATTR. Do not use these options together.`),L=k({},ke),R=g(null),K.html===!0&&(k(L,Ce),k(R,Ae)),K.svg===!0&&(k(L,we),k(R,je),k(R,Ne)),K.svgFilters===!0&&(k(L,Te),k(R,je),k(R,Ne)),K.mathMl===!0&&(k(L,De),k(R,Me),k(R,Ne))),B.tagCheck=null,B.attributeCheck=null,S(e,`ADD_TAGS`)&&(typeof e.ADD_TAGS==`function`?B.tagCheck=e.ADD_TAGS:v(e.ADD_TAGS)&&(L===Ot&&(L=ye(L)),k(L,e.ADD_TAGS,X))),S(e,`ADD_ATTR`)&&(typeof e.ADD_ATTR==`function`?B.attributeCheck=e.ADD_ATTR:v(e.ADD_ATTR)&&(R===kt&&(R=ye(R)),k(R,e.ADD_ATTR,X))),S(e,`ADD_FORBID_CONTENTS`)&&v(e.ADD_FORBID_CONTENTS)&&(q===qt&&(q=ye(q)),k(q,e.ADD_FORBID_CONTENTS,X)),Gt&&(L[`#text`]=!0),U&&k(L,[`html`,`head`,`body`]),L.table&&(L.tbody=!0,delete At.tbody),e.TRUSTED_TYPES_POLICY){if(typeof e.TRUSTED_TYPES_POLICY.createHTML!=`function`)throw E(`TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.`);if(typeof e.TRUSTED_TYPES_POLICY.createScriptURL!=`function`)throw E(`TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.`);let t=P;P=e.TRUSTED_TYPES_POLICY;try{F=lt(``)}catch(e){throw P=t,e}}else e.TRUSTED_TYPES_POLICY===null?(P=void 0,F=``):(P===void 0&&(P=ft()),P&&typeof F==`string`&&(F=lt(``)));fn=m(e)},gn=k({},[...we,...Te,...Ee]),_n=k({},[...De,...Oe]),vn=function(e,t,n){return t===J?e===`svg`:t===Qt?e===`svg`&&(n===`annotation-xml`||an[n]):!!gn[e]},yn=function(e,t,n){return t===J?e===`math`:t===$t?e===`math`&&sn[n]:!!_n[e]},bn=function(e,t,n){return t===$t&&!sn[n]||t===Qt&&!an[n]?!1:!_n[e]&&(ln[e]||!gn[e])},xn=function(e){let t=it(e),n=y(A(e)),r=x(e),i=Y,a=`template`;return r&&O(r)===M.element&&(i=it(r),a=y(A(r))),tn[t]?t===$t?vn(n,i,a):t===Qt?yn(n,i,a):t===J?bn(n,i,a):un===`application/xhtml+xml`:!1},Z=function(e){ae(t.removed,{element:e});try{x(e).removeChild(e)}catch(t){if(ee(e),!x(e))throw E(`a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place`)}},Sn=function(e,t,n){try{te(e,t)}catch(t){try{e.removeAttribute(n)}catch(e){}}},Cn=function(e){Dn(e);let t=b(e);t&&_(oe(t),e=>{try{ee(e)}catch(e){}}),O(e)===M.element&&Tn(e,!1)},wn=function(e,n,r){if(!r)try{r=n.getAttributeNode(e)}catch(e){r=null}if(ae(t.removed,{attribute:r||null,from:n}),r)Sn(n,r,e);else try{n.removeAttribute(e)}catch(e){}if(e===`is`){if(W||Bt)try{Z(n)}catch(e){}else try{n.setAttribute(e,``)}catch(e){}}},Tn=function(e,t){let n=_e(e);if(n)for(let r=n.length-1;r>=0;--r){let i=n[r],a=i&&i.name;typeof a==`string`&&!(t&&R[X(a)])&&Sn(e,i,a)}},En=function(e,t){let n=arguments.length>2&&arguments[2]!==void 0&&arguments[2],r=[e];for(;r.length>0;){let e=r.pop();if(t(e)===!1)continue;if(n&&O(e)===M.element){let t=ge(e);Un(t)&&r.push(t)}let i=b(e);if(i)for(let e=i.length-1;e>=0;--e)r.push(i[e])}},Dn=function(e){En(e,e=>{O(e)===M.element&&Tn(e,!0)})},On=function(e){let t=[];return En(e,e=>{t.push(e)},!0),t},kn=function(e,t){let n=ce();_(On(e),e=>{O(e)===M.element&&le(n,e)}),_(t,e=>{O(e)===M.element&&!ue(n,e)&&Tn(e,!0)})},An=function(e,n){let r=!1;return _(t.removed,t=>{t.element&&(r=r||t.element===e,Dn(t.element))}),kn(e,n),r},jn=function(e,t){let n=G,r=null,i=()=>(r||(r=ce(),_(t,e=>{le(r,e)})),r);for(let t=0;;t++){let r=On(e),a=[e],o=!1;if(_(r,e=>{O(e)===M.documentFragment?ae(a,e):!o&&!ue(n,e)&&(o=ue(i(),e))}),!o)return;if(t>=8)throw E(`the tree kept changing during in-place sanitization; refusing to return it`);_(a,(t,n)=>{Mn(t,n>0,e,i())})}},Mn=function(e,t,n,r){let i=Ln(e),a;for(;a=i.nextNode();)ue(r,a)&&!ue(G,a)&&(t&&Q(I.uponSanitizeShadowNode,a,null),rr(a,n))},Nn=function(e){G&&le(G,e)},Pn=function(e,t){return H?e===`patchsrc`||e===`for`&&t!==`label`&&t!==`output`:!1},Fn=function(e){H&&En(e,e=>{let t=O(e);if(t===M.processingInstruction||t===M.comment&&T(Ke,e.data)){try{ee(e)}catch(e){}return!1}if(t===M.element){let t=e,n=X(A(e));try{t.hasAttribute&&t.hasAttribute(`patchsrc`)&&t.removeAttribute(`patchsrc`),t.hasAttribute&&t.hasAttribute(`for`)&&Pn(`for`,n)&&t.removeAttribute(`for`)}catch(e){}}return!0})},In=function(e){let t=null,r=null;if(zt)e=`<remove></remove>`+e;else{let t=fe(e,Xe);r=t&&t[0]}un===`application/xhtml+xml`&&Y===J&&(e=`<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>`+e+`</body></html>`);let i=P?lt(e):e;if(Y===J)try{t=new u().parseFromString(i,un)}catch(e){}if(!t||!t.documentElement){t=mt.createDocument(Y,`template`,null);try{t.documentElement.innerHTML=en?F:i}catch(e){}}let a=t.body||t.documentElement;return e&&r&&a.insertBefore(n.createTextNode(r),a.childNodes[0]||null),Y===J?_t.call(t,U?`html`:`body`)[0]:U?t.documentElement:a},Ln=function(e){let t=arguments.length>1&&arguments[1]!==void 0&&arguments[1],n=D?D(e):e.ownerDocument;return ht.call(n||e,e,(t?0:l.SHOW_ELEMENT)|l.SHOW_COMMENT|l.SHOW_TEXT|l.SHOW_PROCESSING_INSTRUCTION|l.SHOW_CDATA_SECTION,null)},Rn=function(e){return e=pe(e,yt,` `),e=pe(e,bt,` `),e=pe(e,xt,` `),e},zn=function(e){var t;Bn(e);let n=(t=e.querySelectorAll)==null?void 0:t.call(e,`template`);n&&_(n,e=>{Un(e.content)&&zn(e.content)})},Bn=function(e){e.normalize();let t=Ln(e,!0),n=t.nextNode();for(;n;)n.data=Rn(n.data),n=t.nextNode()},Vn=function(e){let t=w?w(e):null;return typeof t!=`string`||X(t)!==`form`?!1:typeof e.nodeName!=`string`||typeof e.textContent!=`string`||typeof e.removeChild!=`function`||e.attributes!==_e(e)||typeof e.removeAttribute!=`function`||typeof e.removeAttributeNode!=`function`||typeof e.getAttributeNode!=`function`||typeof e.setAttribute!=`function`||typeof e.namespaceURI!=`string`||typeof e.insertBefore!=`function`||typeof e.hasChildNodes!=`function`||e.nodeType!==C(e)||e.childNodes!==b(e)},Hn=function(e){if(!C||typeof e!=`object`||!e)return null;try{let t=C(e);return typeof t==`number`?t:null}catch(e){return null}},Un=function(e){return Hn(e)===M.documentFragment},Wn=function(e){return Hn(e)!==null};function Q(e,n,r){e.length!==0&&_(e,e=>{e.call(t,n,r,fn)})}let Gn=function(e,t,n){return!!(H&&n===M.element&&e.hasChildNodes()&&!Wn(e.firstElementChild)&&T(Ge,e.textContent)&&T(Ge,e.innerHTML)||H&&Ze[t]&&n===M.element&&it(e)===J&&(Wn(e.firstElementChild)||typeof e.textContent==`string`&&T(Ge,e.textContent))||n===M.processingInstruction||H&&n===M.comment&&T(Ke,e.data))},Kn=function(e,t){return e instanceof RegExp?T(e,t):e instanceof Function&&!!e(t,...[...arguments].slice(2))},qn=function(e,t,n){if(!At[t]&&Qn(t)&&Kn(z.tagNameCheck,t))return!1;if(Gt&&!q[t]&&!q[y(t)]){let t=x(e),r=b(e);if(r&&t){let i=r.length;for(let a=i-1;a>=0;--a){let i=e===n?p(r[a],!0):r[a];t.insertBefore(i,ne(e))}}}return Z(e),!0},Jn=function(e,t,n,r){return e.length===0?t:t===n||t===r?ye(t):t},$=function(e,t){return e===t||x(e)!==null?!1:(Kt&&Dn(e),!0)},Yn=function(e,n){if(Nn(e),Q(I.beforeSanitizeElements,e,null),$(e,n))return!0;if(Vn(e))return Z(e),!0;let r=X(A(e)),i=O(e);if(L=Jn(I.uponSanitizeElement,L,Ot,Lt),Q(I.uponSanitizeElement,e,{tagName:r,allowedTags:L}),$(e,n))return!0;if(Gn(e,r,i))return Z(e),!0;if(At[r]||!(B.tagCheck instanceof Function&&B.tagCheck(r))&&!L[r]){let t=qn(e,r,n);return t===!1&&(Q(I.afterSanitizeElements,e,null),$(e,n))?!0:t}if(i===M.element&&!xn(e)||(r===`noscript`||r===`noembed`||r===`noframes`)&&T(qe,e.innerHTML))return Z(e),!0;if(V&&i===M.text){let n=e.textContent,r=Rn(n);n!==r&&(ae(t.removed,{element:e.cloneNode()}),e.textContent=r)}return Q(I.afterSanitizeElements,e,null),$(e,n)},Xn=function(e,t,r){if(jt[t]||Pn(t,e)||Ht&&(t===`id`||t===`name`)&&(r in n||r in pn))return!1;let i=R[t]||B.attributeCheck instanceof Function&&B.attributeCheck(t,e);if(Nt&&T(St,t)||Mt&&T(Ct,t))return!0;if(!i)return Qn(e)&&Kn(z.tagNameCheck,e)&&Kn(z.attributeNameCheck,t,e)||t===`is`&&z.allowCustomizedBuiltInElements&&Kn(z.tagNameCheck,r);if(Xt[t])return!0;let a=pe(r,Tt,``);return T(Dt,a)||(t===`src`||t===`xlink:href`||t===`href`)&&e!==`script`&&me(r,`data:`)===0&&Jt[e]||Pt&&!T(wt,a)?!0:!r},Zn=k({},[`annotation-xml`,`color-profile`,`font-face`,`font-face-format`,`font-face-name`,`font-face-src`,`font-face-uri`,`missing-glyph`]),Qn=function(e){return!Zn[y(e)]&&T(Et,e)},$n=function(e,t,n,r){if(P&&typeof d==`object`&&typeof d.getAttributeType==`function`&&!n)switch(d.getAttributeType(e,t)){case`TrustedHTML`:return lt(r);case`TrustedScriptURL`:return dt(r)}return r},er=function(e,t,n,r){try{return n?e.setAttributeNS(n,t,r):e.setAttribute(t,r),!Vn(e)||(Z(e),!1)}catch(n){return wn(t,e),!1}},tr=function(e,t){return H&&T(Ye,t)?!0:y(e)===`attributename`&&me(t,`href`)!==-1},nr=function(e,n){if(Q(I.beforeSanitizeAttributes,e,null),$(e,n))return;let r=e.attributes;if(!r||Vn(e))return;R=Jn(I.uponSanitizeAttribute,R,kt,Rt);let i={attrName:``,attrValue:``,keepAttr:!0,allowedAttributes:R,forceKeepAttr:void 0},a=r.length,o=X(A(e));for(;a--;){let n=r[a],s=n.name,c=n.namespaceURI,l=n.value,u=X(s),d=l,f=s===`value`?d:he(d),p=!1;i.attrName=u,i.attrValue=f,i.keepAttr=!0,i.forceKeepAttr=void 0,Q(I.uponSanitizeAttribute,e,i),f=i.attrValue,Ut&&(u===`id`||u===`name`)&&me(f,Wt)!==0&&(wn(s,e,n),f=Wt+f,p=!0),tr(s,f)?wn(s,e,n):i.forceKeepAttr||(i.keepAttr?!Ft&&T(Je,f)?wn(s,e,n):(V&&(f=Rn(f)),Xn(o,u,f)?(f=$n(o,u,c,f),f!==d&&er(e,s,c,f)&&p&&ie(t.removed)):wn(s,e,n)):wn(s,e,n))}Q(I.afterSanitizeAttributes,e,null),$(e,n)},rr=function(e,t){Yn(e,t),nr(e,t),Un(e.content)&&ir(e.content)},ir=function(e){let t=null,n=Ln(e);for(Q(I.beforeSanitizeShadowDOM,e,null);t=n.nextNode();)if(Q(I.uponSanitizeShadowNode,t,null),rr(t,e),O(t)===M.element){let e=ge(t);Un(e)&&(ar(e),ir(e))}V&&Bn(e),Q(I.afterSanitizeShadowDOM,e,null)},ar=function(e){let t=[{node:e,shadow:null}];for(;t.length>0;){let e=t.pop();if(e.shadow){ir(e.shadow);continue}let n=e.node,r=O(n)===M.element,i=b(n);if(i)for(let e=i.length-1;e>=0;--e)t.push({node:i[e],shadow:null});if(r){let e=w?w(n):null;if(typeof e==`string`&&X(e)===`template`){let e=n.content;Un(e)&&t.push({node:e,shadow:null})}}if(r){let e=ge(n);Un(e)&&t.push({node:null,shadow:e},{node:e,shadow:null})}}};return t.sanitize=function(e){let n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},i=null,a=null,o=null,s=null;if(en=!e,en&&(e=`<!-->`),typeof e!=`string`&&!Wn(e)&&(e=be(e),typeof e!=`string`))throw E(`dirty is not a string, aborting`);if(!t.isSupported)return e;It?(L=Lt,R=Rt):hn(n),t.removed=[];let c=Kt&&typeof e!=`string`&&Wn(e),l=[],u=G;if(c){Fn(e);let t=A(e);if(typeof t==`string`){let n=X(t);if(!L[n]||At[n])throw Cn(e),E(`root node is forbidden and cannot be sanitized in-place`)}if(Vn(e))throw Cn(e),E(`root node is clobbered and cannot be sanitized in-place`);l=On(e),G=ce()}else if(Wn(e))i=In(`<!---->`),a=i.ownerDocument.importNode(e,!0),a.nodeType===M.element&&a.nodeName===`BODY`||a.nodeName===`HTML`?i=a:i.appendChild(a),ar(i);else{if(!W&&!V&&!U&&e.indexOf(`<`)===-1)return ut(e);if(i=In(e),!i)return W?null:Vt?F:``}i&&zt&&Z(i.firstChild);let d=c?e:i;try{c&&ar(e);let t=Ln(d);for(;o=t.nextNode();)rr(o,d);c&&jn(e,l)}catch(t){throw c&&(Cn(e),An(e,l)),t}finally{G=u}if(c){if(An(e,l))throw E(`a node selected for removal could not be safely returned; refusing to sanitize in place`);return V&&zn(e),e}if(W){if(V&&zn(i),Bt)for(s=gt.call(i.ownerDocument);i.firstChild;)s.appendChild(i.firstChild);else s=i;return(R.shadowroot||R.shadowrootmode)&&(s=vt.call(r,s,!0)),s}let f=()=>U?i.outerHTML:i.innerHTML,p=f();return V&&T(Le,p)&&(Bn(i),p=f()),U&&L[`!doctype`]&&i.ownerDocument&&i.ownerDocument.doctype&&i.ownerDocument.doctype.name&&T(Ue,i.ownerDocument.doctype.name)&&(p=`<!DOCTYPE `+i.ownerDocument.doctype.name+`>`+p),ut(p)},t.setConfig=function(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};hn(e),It=!0,Lt=L,Rt=R},t.clearConfig=function(){fn=null,It=!1,Lt=null,Rt=null,P=at,F=``},t.isValidAttribute=function(e,t,n){fn||hn({});let r=X(e),i=X(t);return typeof n==`string`&&(tr(t,n)||!Ft&&T(Je,n))?!1:Xn(r,i,n)},t.addHook=function(e,t){typeof t==`function`&&S(I,e)&&ae(I[e],t)},t.removeHook=function(e,t){if(S(I,e)){if(t!==void 0){let n=re(I[e],t);return n===-1?void 0:se(I[e],n,1)[0]}return ie(I[e])}},t.removeHooks=function(e){S(I,e)&&(I[e]=[])},t.removeAllHooks=function(){I=et()},t}return nt();
			})();
		})();

		// ACTIONS {

			t.actions = {};

			t.doAction = function( part, action, param = 'undefined' ) {

				// t.doAction( 'part', 'action', param );
				// exit if there is no action
				if (
					typeof t.actions[ part ] == 'undefined'
					|| typeof t.actions[ part ][ action ] == 'undefined'
				) {

					//console.log( 'The action "' + action + '" does not exist in "t.' + part + '".' );
					return;
				}

				/* Defines action return object

					Data structure:
					ret{
						key: [ value1, value2 ]
					}

					The values are the different addAction() returns to the same key.
				*/
				let ret = {};

				// loop through and fire actions
				for ( var prioIndex in t.actions[ part ][ action ] ) {

					for ( var action_index in t.actions[ part ][ action ][ prioIndex ] ) {

						let tempRet = t.actions[ part ][ action ][ prioIndex ][ action_index ]( param );

						// Add action return {

							if ( typeof tempRet === 'object' ) {

								for ( let key in tempRet ) {

									if ( tempRet.hasOwnProperty(key) ) {

										if ( typeof ret[key] !== 'object' ) {

											ret[key] = [];
										}

										ret[key].push( tempRet[key] );
									}
								}
							}

						// }
					}
				}

				return ret;
			};

			t.addAction = function( part, action, callback, prio ) {

				if ( typeof prio === 'undefined' ) {

					prio = 10;
				}

				// t.addAction( 'part', 'action', t.callback, prio );

				// if there is no action object, define it
				if ( typeof t.actions[ part ] == 'undefined' ) {

					t.actions[ part ] = {};
				}

				// if there is no action, define it
				if ( typeof t.actions[ part ][ action ] == 'undefined' ) {

					t.actions[ part ][ action ] = {};
				}

				// if there is no action, define it
				if ( typeof t.actions[ part ][ action ][ prio ] == 'undefined' ) {

					t.actions[ part ][ action ][ prio ] = [];
				}

				// push new action to the action array
				t.actions[ part ][ action ][ prio ].push( callback );

			};

		// }

		// FILTERS {

			t.filters = {};

			t.doFilter = function( part, filter, value, param = {} ) {

				param.filter = {
					part: part,
					filter: filter
				};

				// t..doFilter( 'part', 'filter', value );
				// exit if there is no filter
				if (
					typeof t.filters[ part ] == 'undefined'
					|| typeof t.filters[ part ][ filter ] == 'undefined'
				) {

					//console.log( 'The filter "' + filter + '" does not exist in "t.' + part + '".' );
					return value;
				}

				// sort
				t.filters[ part ][ filter ].sort();

				// loop through and fire filter
				for ( var filterIndex in t.filters[ part ][ filter ] ) {

					for ( var prioIndex in t.filters[ part ][ filter ][ filterIndex ] ) {

						value = t.filters[ part ][ filter ][ filterIndex ][ prioIndex ]( value, param );

						// APPLY FILTER ONCE {

							if (
								typeof value === 'object' &&
								value !== null &&
								typeof value.applyOnce === 'boolean' &&
								value.applyOnce === true
							) {

								delete t.filters[ part ][ filter ][ filterIndex ][ prioIndex ];

								value = value.value;
							}

						// }
					}
				}

				return value;
			};

			t.addFilter = function( part, filter, callback, prio ) {

				if ( typeof prio === 'undefined' ) {

					prio = 10;
				}

				// t.addFilter( 'part', 'filter', t.callback );

				// if there is no filter object, define it
				if ( typeof t.filters[ part ] == 'undefined' ) {

					t.filters[ part ] = {};
				}

				// if there is no filter, define it
				if ( typeof t.filters[ part ][ filter ] == 'undefined' ) {

					t.filters[ part ][ filter ] = [];
				}

				// if there is no priority, define it
				if ( typeof t.filters[ part ][ filter ][ prio ] == 'undefined' ) {

					t.filters[ part ][ filter ][ prio ] = [];
				}

				// push new filter to the filter array
				t.filters[ part ][ filter ][ prio ].push( callback );

			};

		// }
	};

	ACFTableField = new ACFTableFieldMain();
	document.dispatchEvent(new CustomEvent('tableFieldRegisterHooks'));

})( jQuery );
