import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'location',
  title: 'Location',
  type: 'object',
  fields: [
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
    }),
    defineField({
      name: 'state',
      title: 'State',
      type: 'string',
    }),
    defineField({
      name: 'pincode',
      title: 'Pincode',
      type: 'string',
    }),
    defineField({
      name: 'geopoint',
      title: 'Geopoint',
      type: 'geopoint',
    }),
  ],
})
