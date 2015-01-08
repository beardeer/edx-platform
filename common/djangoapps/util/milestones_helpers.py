NAMESPACE_CHOICES = {
    'ENTRANCE_EXAM': 'entrance_exams'
}

def generate_milestone_namespace(namespace, course_key=None):
    if namespace in NAMESPACE_CHOICES.values():
        if namespace == 'entrance_exams':
            return '{}.{}'.format(unicode(course_key), NAMESPACE_CHOICES['ENTRANCE_EXAM'])